'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { Button } from '@/components/ui/Button';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import { detectDevice } from '@/lib/leads';
import { interpolate } from '@/lib/messages';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';
import { getPublicAvailability, type PublicAvailabilitySlot } from '@/lib/actions/availability';
import { submitPartnerLead, type MeetingFormat } from '@/lib/actions/partnerLead';
import { FieldSelect } from '@/components/ui/FieldSelect';
import {
  confirmPhoneCode,
  isPhoneVerificationRequired,
  sendPhoneCode,
} from '@/lib/actions/phoneVerification';
import type { Branch } from '@/lib/branches';

export interface PartnerBookingPopupProps {
  open: boolean;
  onClose: () => void;
  sourceCta: string;
  /** Fetched server-side (`getBranches()`) and threaded down through
   * `PartnersBookingProvider` — this is a Client Component, and hitting the
   * API's internal origin straight from the browser is exactly what
   * `lib/actions/*` exist to avoid (see `submitPartnerLead`'s doc comment). */
  branches: Branch[];
  /** The real site `<Footer>`, rendered server-side and passed down through
   * `PartnersBookingProvider` — shown at the bottom of this dialog's own
   * scrollable content, per explicit user feedback that the header being
   * visible wasn't enough on its own; the dialog reads as a real page, so
   * it keeps both ends of the site's normal page chrome. */
  footer: ReactNode;
}

type Status = 'idle' | 'submitting' | 'code' | 'success' | 'conflict' | 'error';

/** Half-hour slots across a business day. Figma's own calendar (node
 * 291:846, "Ամրագրում" card) shows a scrollable list of ~16 times at this
 * granularity (12:00, 13:00, 13:30, 14:00, 15:00 …), not the written spec's
 * older 6-slot set — trusted as the more current design here since it's a
 * clearly-rendered, deliberate list rather than something Figma is silent
 * about. */
const FIXED_TIMES = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]; // prettier-ignore

const MAX_DAYS_AHEAD = 60; // Matches `GET /public/availability`'s own clamp.

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface GridCell {
  date: Date;
  inMonth: boolean;
}

/** A full 6×7 Monday-first grid for `month`, including the trailing days of
 * the previous month and the leading days of the next — Figma's calendar
 * (node 291:846) shows those adjacent-month days as real, muted numbers
 * (e.g. "29 30 31" then "01 02 03 04" in gray), not blank cells. */
function buildMonthGrid(month: Date): GridCell[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstOfMonth = new Date(year, m, 1);
  // getDay(): 0=Sun..6=Sat → shift to Monday-first (0=Mon..6=Sun).
  const leadingCount = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, m, 1 - leadingCount);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { date, inMonth: date.getMonth() === m };
  });
}

/**
 * `/partners` S5 final CTA — the "Become a dealer" meeting-booking popup
 * (`references/pages.md` §5 S5, Figma node 291:846's "Become a dealer"
 * frame, file 9Lq4XpWusTJj1VnM6laAZr).
 *
 * This is a bespoke dialog shell, not the shared `Dialog` component every
 * other popup on the site uses — Figma's own frame (1344×850 of a 1440×932
 * canvas) is a near-fullscreen takeover, not a small centered card: a bare
 * "‹" chevron + a 44px light-weight title, then two separate white
 * `rounded-[32px]` cards side by side (contact info / booking), each on a
 * light page-toned backdrop rather than the site's usual dark scrim. Two
 * consequences of matching that instead of reusing `Dialog`:
 *  - No top-right X — Figma shows only the leading chevron as the close
 *    affordance (Esc and overlay-click still close it, matching every
 *    other popup's a11y contract).
 *  - The backdrop is light (`bg-surface-light`), not `bg-bg/70`: Figma's
 *    title text is dark (`Neutral/100`), which would be unreadable on the
 *    site's usual dark scrim — the light backdrop isn't a stylistic choice
 *    made here, it's what makes the rest of Figma's own spec legible.
 * Sized generously on purpose: the previous build capped this at
 * `max-w-3xl` with `overflow-y-auto`, which is what forced an internal
 * scrollbar on a form this size. This one is wide enough on desktop that
 * scrolling shouldn't be needed for the form itself.
 *
 * `z-20` — deliberately *below* `Header`'s `z-30` — so the site's own nav
 * stays visible and usable above this overlay instead of being covered by
 * it (per explicit user feedback); the top padding (`pt-28`/`sm:pt-36`)
 * gives the title room to clear the header instead of starting right
 * under it. The focus trap still only covers this dialog's own content —
 * the header is visible but intentionally not part of the Tab order while
 * the dialog is open, same as any visible-but-inert page chrome behind an
 * open dialog.
 *
 * The real site `<Footer>` renders at the bottom of this same scrollable
 * area, below the panel (as a sibling, not nested inside its
 * `max-w-[1344px]` column, so it spans the full width a footer normally
 * does). It's a server-fetched prop, not something this component renders
 * itself — see `footer`'s own doc comment on `PartnerBookingPopupProps`.
 *
 * Two structural fixes vs. the previous build, both because Figma clearly
 * shows a different layout, not because it's silent:
 *  - Phone and email sit side by side (one row, two fields), not stacked.
 *  - Meeting format is a single select (📍/💻/🏢 + label, chevron) matching
 *    every other dropdown in this form, not three radio-cards — the
 *    written spec's "radio-cards" description is superseded by Figma's
 *    current, clearly-different treatment.
 *
 * Weekday/month names (calendar header, weekday row, summary line) come
 * from `t.calendar` rather than `Intl.DateTimeFormat(locale, …)`: Chrome's
 * bundled ICU data doesn't include Armenian on every platform, and a
 * locale `Intl` can't format silently falls back to `en-US` instead of
 * throwing — confirmed live (`resolvedOptions().locale` came back
 * `"en-US"` for `'hy'`) while `'ru'`/`'en'` formatted correctly. On a site
 * that's entirely Armenian-language, that fallback is a real risk, not a
 * hypothetical one, so this reads the same static name arrays everywhere
 * instead of trusting the visitor's browser to have Armenian ICU data.
 *
 * Slot data: `getPublicAvailability` (`lib/actions/availability.ts`) is
 * fetched per visible calendar month. A time counts as taken only when a
 * real `AvailabilitySlot` exists at that exact local time with
 * `open: false`; otherwise every half-hour slot is offered even on days no
 * admin has explicitly generated slots for yet. When a matching slot
 * exists, its id is sent as `meetingSlotId` so the API binds the exact
 * time and can 409 if it fills between load and submit; otherwise a plain
 * `meetingAt` is sent.
 *
 * Deliberate simplification vs. the written spec: the spec also describes
 * a mobile-only 3-step wizard with its own progress bar. Figma's own
 * mockup only shows this one desktop frame — no mobile wizard frame exists
 * to verify against — so this ships the same single-scroll-of-the-page
 * form on every breakpoint (stacking to one column below `lg`) instead of
 * fabricating step-transition behavior nobody has actually designed. The
 * `steps`/`nav` message keys stay in place for whoever builds the real
 * wizard later. Figma's own mockup also doesn't show a submit button or
 * summary line at all (the "Ամրագրում" card just ends after the
 * format/branch/address field) — the written spec is authoritative there
 * since Figma is silent, not showing something different, so both stay.
 */
export function PartnerBookingPopup({
  open,
  onClose,
  sourceCta,
  branches,
  footer,
}: PartnerBookingPopupProps) {
  const t = useMessages().partners.bookingPopup;
  const locale = useLocale();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+374 ');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [activityType, setActivityType] = useState('');
  const [comment, setComment] = useState('');

  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [meetingFormat, setMeetingFormat] = useState<MeetingFormat>('ONLINE');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [address, setAddress] = useState('');

  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [successName, setSuccessName] = useState('');

  // SMS-code check: the API decides whether it is required. `proof` is the
  // signed token for exactly `proof.phone`; editing the number invalidates it.
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [proof, setProof] = useState<{ phone: string; token: string } | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Reset on every (re)open — same adjust-during-render pattern
  // `UsaAuctionContactPopup` uses.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName('');
      setPhone('+374 ');
      setEmail('');
      setCompany('');
      setActivityType('');
      setComment('');
      setVisibleMonth(startOfDay(new Date()));
      setSelectedDate(null);
      setSelectedTime(null);
      setMeetingFormat('ONLINE');
      setBranchId(branches[0]?.id ?? '');
      setAddress('');
      setTouched(false);
      setStatus('idle');
    }
  }

  useEffect(() => {
    if (!open) return;
    const from = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).toISOString();
    const to = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString();
    let cancelled = false;
    void getPublicAvailability({ from, to }).then((items) => {
      if (!cancelled) setSlots(items);
    });
    return () => {
      cancelled = true;
    };
  }, [open, visibleMonth]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, PublicAvailabilitySlot[]>();
    for (const slot of slots) {
      const key = dateKey(new Date(slot.startsAt));
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots]);

  const daySlots = selectedDate ? (slotsByDay.get(dateKey(selectedDate)) ?? []) : [];

  function slotForTime(time: string): PublicAvailabilitySlot | undefined {
    return daySlots.find((slot) => {
      const d = new Date(slot.startsAt);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}` === time;
    });
  }

  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  const monthGrid = buildMonthGrid(visibleMonth);

  const isFirstNavigableMonth =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();
  const isLastNavigableMonth =
    visibleMonth.getFullYear() === maxDate.getFullYear() &&
    visibleMonth.getMonth() === maxDate.getMonth();

  const nameError = touched && name.trim().length === 0;
  const phoneError = touched && !isValidArmenianPhone(phone);
  const companyError = touched && company.trim().length === 0;
  const slotError = touched && (!selectedDate || !selectedTime);
  const branchRequired = meetingFormat === 'OFFICE' && !branchId;
  const addressRequired = meetingFormat === 'OTHER' && address.trim().length === 0;

  const isValid =
    name.trim().length > 0 &&
    isValidArmenianPhone(phone) &&
    company.trim().length > 0 &&
    activityType.length > 0 &&
    !!selectedDate &&
    !!selectedTime &&
    !branchRequired &&
    !addressRequired;

  const formatEmoji: Record<MeetingFormat, string> = {
    ONLINE: '💻',
    OFFICE: '🏢',
    OTHER: '📍',
  };

  const summaryLine = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    const weekday = t.calendar.weekdaysLong[selectedDate.getDay()];
    const month = t.calendar.months[selectedDate.getMonth()];
    const formatLabel =
      t.formatOptions[meetingFormat.toLowerCase() as 'online' | 'office' | 'other'];
    return interpolate(t.summaryTemplate, {
      weekday,
      day: String(selectedDate.getDate()),
      month,
      time: selectedTime,
      format: formatLabel,
    });
  }, [selectedDate, selectedTime, meetingFormat, t]);

  async function requestCode(): Promise<boolean> {
    const result = await sendPhoneCode(phone, locale);
    if (result.ok) {
      setCode('');
      setCodeError(null);
      setResendIn(30);
      return true;
    }
    setCodeError(
      result.reason === 'rate'
        ? t.verify.errors.tooMany
        : result.reason === 'invalid'
          ? t.verify.errors.invalidPhone
          : t.verify.errors.sendFailed,
    );
    return false;
  }

  async function handleSubmit() {
    if (!isValid || !selectedDate || !selectedTime) {
      setTouched(true);
      return;
    }
    setStatus('submitting');

    // Ask for the SMS code first, unless the API does not need one or this very
    // number was already proven.
    if (proof?.phone !== phone && (await isPhoneVerificationRequired())) {
      await requestCode();
      setStatus('code');
      return;
    }
    await submitLead(proof?.phone === phone ? proof.token : undefined);
  }

  async function handleConfirmCode() {
    if (!/^\d{6}$/.test(code)) {
      setCodeError(t.verify.errors.wrong);
      return;
    }
    setCodeBusy(true);
    setCodeError(null);
    const result = await confirmPhoneCode(phone, code);
    setCodeBusy(false);
    if (!result.ok) {
      setCodeError(result.reason === 'wrong' ? t.verify.errors.wrong : t.verify.errors.expired);
      return;
    }
    setProof({ phone, token: result.token });
    setStatus('submitting');
    await submitLead(result.token);
  }

  async function submitLead(phoneVerificationToken: string | undefined) {
    if (!selectedDate || !selectedTime) return;

    const matchedSlot = slotForTime(selectedTime);
    const meetingAt = matchedSlot
      ? undefined
      : new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          ...(selectedTime.split(':').map(Number) as [number, number]),
        ).toISOString();

    const result = await submitPartnerLead({
      answers: {
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        activityType: activityType || undefined,
        comment: comment.trim() || undefined,
        meetingFormat,
        meetingSlotId: matchedSlot?.id,
        meetingAt,
        meetingBranchId: meetingFormat === 'OFFICE' ? branchId : undefined,
        meetingAddress: meetingFormat === 'OTHER' ? address.trim() : undefined,
        phoneVerificationToken,
      },
      hidden: {
        sourcePage: '/partners',
        sourceCta,
        timestamp: new Date().toISOString(),
        locale,
        device: detectDevice(),
      },
    });

    if (result.ok) {
      setSuccessName(name.trim());
      setStatus('success');
    } else if (result.reason === 'conflict') {
      setStatus('conflict');
      setSelectedTime(null);
    } else if (result.reason === 'unverified') {
      // The proof expired between the check and the submit: ask again.
      setProof(null);
      await requestCode();
      setStatus('code');
    } else {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <SuccessDialog
        open={open}
        onClose={onClose}
        heading={t.successHeading}
        body={interpolate(t.successTemplate, { name: successName })}
        detail={summaryLine ?? undefined}
        closeLabel={t.close}
      />
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center overflow-y-auto bg-surface-light pb-0 pt-28 sm:pt-36">
      <button
        type="button"
        aria-label={t.close}
        onClick={onClose}
        className="fixed inset-0 -z-10"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="mx-4 mb-16 flex w-full max-w-[1344px] flex-col gap-8 outline-none sm:mx-6 sm:mb-24 sm:gap-12"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill text-ink transition-colors hover:bg-white sm:size-12"
          >
            <svg width="44" height="44" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2
            id={titleId}
            className="font-display text-[26px] font-light leading-tight text-ink sm:text-[36px] lg:text-[44px] lg:leading-[58px]"
          >
            {t.title}
          </h2>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact info — Figma 441:5251: 660px card, 602px form, 32px rhythm. */}
            <div className="rounded-[32px] bg-white px-4 py-6 sm:px-[10px] lg:flex lg:justify-center">
              <div className="flex w-full flex-col gap-8 sm:px-5 lg:max-w-[602px] lg:px-0">
                <h3 className="stretch-90 text-[24px] font-bold leading-9 text-ink">
                  {t.contactHeading}
                </h3>

                <Field id="pbp-name" label={`${t.nameLabel}*`}>
                  <input
                    id="pbp-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={nameError}
                    aria-describedby={nameError ? 'pbp-name-error' : undefined}
                    placeholder={t.namePlaceholder}
                    className={INPUT}
                  />
                  {nameError && (
                    <FieldError id="pbp-name-error">{t.errors.nameRequired}</FieldError>
                  )}
                </Field>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                  <Field id="pbp-phone" label={`${t.phoneLabel}*`}>
                    <input
                      id="pbp-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(formatArmenianPhone(event.target.value))}
                      onBlur={() => setTouched(true)}
                      aria-invalid={phoneError}
                      aria-describedby={phoneError ? 'pbp-phone-error' : undefined}
                      className={INPUT}
                    />
                    {phoneError && (
                      <FieldError id="pbp-phone-error">{t.errors.phoneInvalid}</FieldError>
                    )}
                  </Field>
                  <Field id="pbp-email" label={t.emailLabel}>
                    <input
                      id="pbp-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t.emailPlaceholder}
                      className={INPUT}
                    />
                  </Field>
                </div>

                <Field id="pbp-company" label={`${t.companyLabel}*`}>
                  <input
                    id="pbp-company"
                    name="company"
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={companyError}
                    aria-describedby={companyError ? 'pbp-company-error' : undefined}
                    placeholder={t.namePlaceholder}
                    className={INPUT}
                  />
                  {companyError && (
                    <FieldError id="pbp-company-error">{t.errors.companyRequired}</FieldError>
                  )}
                </Field>

                <Field id="pbp-activity" label={`${t.activityLabel}*`}>
                  <FieldSelect
                    id="pbp-activity"
                    label={t.activityLabel}
                    value={activityType}
                    onChange={setActivityType}
                    placeholder={Object.values(t.activityOptions)[0]}
                    options={Object.values(t.activityOptions).map((label) => ({
                      value: label,
                      label,
                    }))}
                  />
                </Field>

                <Field id="pbp-comment" label={t.commentLabel}>
                  <input
                    id="pbp-comment"
                    name="comment"
                    type="text"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={t.commentPlaceholder}
                    className={INPUT}
                  />
                </Field>
              </div>
            </div>

            {/* Booking — Figma 441:5418: calendar sidebar (468px) + slot column. */}
            <div className="rounded-[32px] bg-white px-4 py-6 sm:px-7">
              <div className="flex flex-col gap-6">
                <h3 className="stretch-90 text-[24px] font-bold leading-9 text-ink">
                  {t.bookingHeading}
                </h3>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="w-full rounded-[20px] bg-neutral-25 sm:w-[468px]">
                    <div className="flex items-center justify-between gap-2 px-6 py-4">
                      <span className="stretch-90 text-[24px] font-bold leading-[32px] text-neutral-800 sm:text-[32px] sm:leading-[40px]">
                        {t.calendar.monthsNominative[visibleMonth.getMonth()]}
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={t.nav.prevMonth}
                          disabled={isFirstNavigableMonth}
                          onClick={() =>
                            setVisibleMonth(
                              (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                            )
                          }
                          className="flex size-11 items-center justify-center rounded-pill text-[24px] text-neutral-800 hover:bg-white disabled:pointer-events-none disabled:opacity-30"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label={t.nav.nextMonth}
                          disabled={isLastNavigableMonth}
                          onClick={() =>
                            setVisibleMonth(
                              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                            )
                          }
                          className="flex size-11 items-center justify-center rounded-pill text-[24px] text-neutral-800 hover:bg-white disabled:pointer-events-none disabled:opacity-30"
                        >
                          ›
                        </button>
                      </span>
                    </div>
                    <div className="grid grid-cols-7 px-2 pb-3 text-center sm:px-4">
                      {t.calendar.weekdaysShort.map((label, index) => (
                        <span
                          key={`${label}-${index}`}
                          className="py-2 text-[14px] leading-6 text-neutral-800/70 lowercase sm:text-[16px] sm:leading-[38px]"
                        >
                          {label}
                        </span>
                      ))}
                      {monthGrid.map(({ date: cellDate, inMonth }) => {
                        const disabled = !inMonth || cellDate < today || cellDate > maxDate;
                        const isSelected =
                          selectedDate && dateKey(cellDate) === dateKey(selectedDate);
                        return (
                          <span key={dateKey(cellDate)} className="flex justify-center py-[3px]">
                            <button
                              type="button"
                              disabled={disabled}
                              aria-pressed={Boolean(isSelected)}
                              onClick={() => {
                                setSelectedDate(cellDate);
                                setSelectedTime(null);
                              }}
                              className={`flex size-11 items-center justify-center rounded-pill text-[16px] tabular-nums transition-colors sm:size-[46px] sm:text-[24px] ${
                                isSelected
                                  ? 'bg-accent text-white'
                                  : !inMonth
                                    ? 'text-neutral-800/30'
                                    : disabled
                                      ? 'text-neutral-800/30'
                                      : 'text-neutral-800 hover:bg-white'
                              }`}
                            >
                              {String(cellDate.getDate()).padStart(2, '0')}
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[20px] bg-neutral-25 p-3 sm:h-[410px] sm:w-[110px] sm:shrink-0">
                    <span className="sr-only">{t.timeSlotsLabel}</span>
                    {selectedDate ? (
                      <div className="flex max-h-[386px] flex-row flex-wrap gap-2 overflow-y-auto sm:h-[386px] sm:max-h-none sm:flex-col sm:flex-nowrap sm:gap-4 sm:pr-1 [scrollbar-color:#cccfd0_#f5f5f6] [scrollbar-width:thin]">
                        {FIXED_TIMES.map((time) => {
                          const matched = slotForTime(time);
                          const taken = matched ? !matched.open : false;
                          const isSelected = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={taken}
                              aria-pressed={isSelected}
                              onClick={() => setSelectedTime(time)}
                              className={`flex h-11 shrink-0 items-center justify-center rounded-[8px] px-6 text-[14px] leading-[18px] tabular-nums transition-colors sm:h-[34px] sm:w-[86px] sm:px-0 ${
                                isSelected
                                  ? 'bg-accent font-medium text-neutral-800'
                                  : taken
                                    ? 'bg-white text-neutral-500'
                                    : 'bg-white text-neutral-800 hover:bg-white/60'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="px-1 py-2 text-[12px] leading-4 text-neutral-700">
                        {t.noTimes}
                      </p>
                    )}
                  </div>
                </div>
                {slotError && <p className="text-small text-accent">{t.errors.slotRequired}</p>}

                <Field id="pbp-format" label={t.formatLabel}>
                  <FieldSelect
                    id="pbp-format"
                    label={t.formatLabel}
                    value={meetingFormat}
                    onChange={(next) => setMeetingFormat(next as MeetingFormat)}
                    options={(['ONLINE', 'OFFICE', 'OTHER'] as const).map((format) => ({
                      value: format,
                      label: `${formatEmoji[format]} ${t.formatOptions[format.toLowerCase() as 'online' | 'office' | 'other']}`,
                    }))}
                  />
                </Field>

                {meetingFormat === 'OFFICE' && (
                  <Field id="pbp-branch" label={t.branchLabel}>
                    <FieldSelect
                      id="pbp-branch"
                      label={t.branchLabel}
                      value={branchId}
                      onChange={setBranchId}
                      options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
                    />
                  </Field>
                )}

                {meetingFormat === 'OTHER' && (
                  <Field id="pbp-address" label={t.addressLabel} hideLabel>
                    <input
                      id="pbp-address"
                      type="text"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder={t.addressLabel}
                      className={INPUT}
                    />
                  </Field>
                )}

                {summaryLine && <p className="text-small font-medium text-ink">{summaryLine}</p>}
                {status === 'conflict' && (
                  <p className="text-small text-accent">{t.errors.slotTaken}</p>
                )}
              </div>
            </div>
          </div>

          {status === 'code' && (
            <div
              role="group"
              aria-labelledby="pbp-verify-title"
              className="mt-8 flex flex-col gap-4 rounded-[24px] bg-white p-6 sm:max-w-[520px]"
            >
              <div>
                <h3 id="pbp-verify-title" className="text-[20px] font-medium leading-7 text-ink">
                  {t.verify.heading}
                </h3>
                <p className="mt-1 text-small text-neutral-700">
                  {interpolate(t.verify.text, { phone })}
                </p>
              </div>
              <div>
                <label htmlFor="pbp-code" className="mb-2 block text-small font-medium text-ink">
                  {t.verify.codeLabel}
                </label>
                <input
                  id="pbp-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  aria-invalid={Boolean(codeError)}
                  aria-describedby={codeError ? 'pbp-code-error' : undefined}
                  className="h-12 w-full rounded-pill border border-line-light px-4 text-center text-[20px] tracking-[0.4em] tabular-nums text-ink outline-none focus:border-accent"
                />
                {codeError && (
                  <p id="pbp-code-error" role="alert" className="mt-1 text-small text-accent">
                    {codeError}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  disabled={codeBusy || code.length !== 6}
                  onClick={() => void handleConfirmCode()}
                >
                  {codeBusy ? t.verify.confirming : t.verify.confirm}
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  className="text-ink"
                  disabled={resendIn > 0 || codeBusy}
                  onClick={() => void requestCode()}
                >
                  {resendIn > 0
                    ? interpolate(t.verify.resendIn, { seconds: String(resendIn) })
                    : t.verify.resend}
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  className="text-ink"
                  onClick={() => {
                    setStatus('idle');
                    setCodeError(null);
                  }}
                >
                  {t.verify.change}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="tertiary" className="text-ink" onClick={onClose}>
              {t.close}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={status === 'submitting' || status === 'code' || !isValid}
            >
              {status === 'submitting' ? t.sending : t.submit}
            </Button>
          </div>
        </form>
      </div>

      <div className="w-full">{footer}</div>
    </div>
  );
}

/** The 72px pill every text field uses (Figma "Input Text": #FAFAFA, 50px corners, 24px inset). */
const INPUT =
  'h-[72px] w-full rounded-[50px] bg-neutral-25 px-6 text-[16px] leading-6 text-neutral-800 outline-none placeholder:text-neutral-600 focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-accent';

/** Label (16/20 medium) over a field, 8px apart — Figma's "12px" form row. */
function Field({
  id,
  label,
  hideLabel = false,
  children,
}: {
  id: string;
  label: string;
  hideLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'text-[16px] font-medium leading-5 text-neutral-800'}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="text-small text-accent">
      {children}
    </p>
  );
}
