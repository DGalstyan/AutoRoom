'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { Button } from '@/components/ui/Button';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import { detectDevice } from '@/lib/leads';
import { interpolate } from '@/lib/messages';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';
import { getPublicAvailability, type PublicAvailabilitySlot } from '@/lib/actions/availability';
import { submitPartnerLead, type MeetingFormat } from '@/lib/actions/partnerLead';
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
}

type Status = 'idle' | 'submitting' | 'success' | 'conflict' | 'error';

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
  const slotError = touched && (!selectedDate || !selectedTime);
  const branchRequired = meetingFormat === 'OFFICE' && !branchId;
  const addressRequired = meetingFormat === 'OTHER' && address.trim().length === 0;

  const isValid =
    name.trim().length > 0 &&
    isValidArmenianPhone(phone) &&
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

  async function handleSubmit() {
    if (!isValid || !selectedDate || !selectedTime) {
      setTouched(true);
      return;
    }
    setStatus('submitting');

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
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-surface-light pb-6 pt-28 sm:pb-10 sm:pt-36">
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
        className="mx-4 flex w-full max-w-[1344px] flex-col gap-8 outline-none sm:mx-6 sm:gap-12"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill text-ink transition-colors hover:bg-white sm:size-12"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="1.75"
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
            {/* Contact info */}
            <div className="rounded-[32px] bg-white p-6 sm:p-8">
              <h3 className="mb-6 font-display text-h4 font-bold text-ink">{t.contactHeading}</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pbp-name" className="mb-2 block text-small font-medium text-ink">
                    {t.nameLabel}
                  </label>
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
                    className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                  />
                  {nameError && (
                    <p id="pbp-name-error" className="mt-1 text-small text-accent">
                      {t.errors.nameRequired}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pbp-phone"
                      className="mb-2 block text-small font-medium text-ink"
                    >
                      {t.phoneLabel}
                    </label>
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
                      className="h-12 w-full rounded-pill border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                    />
                    {phoneError && (
                      <p id="pbp-phone-error" className="mt-1 text-small text-accent">
                        {t.errors.phoneInvalid}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="pbp-email"
                      className="mb-2 block text-small font-medium text-ink"
                    >
                      {t.emailLabel}
                    </label>
                    <input
                      id="pbp-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pbp-company"
                    className="mb-2 block text-small font-medium text-ink"
                  >
                    {t.companyLabel}
                  </label>
                  <input
                    id="pbp-company"
                    name="company"
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pbp-activity"
                    className="mb-2 block text-small font-medium text-ink"
                  >
                    {t.activityLabel}
                  </label>
                  <select
                    id="pbp-activity"
                    name="activityType"
                    value={activityType}
                    onChange={(event) => setActivityType(event.target.value)}
                    className="h-12 w-full rounded-md border border-line-light bg-white px-4 text-body text-ink outline-none focus:border-accent"
                  >
                    <option value="" />
                    {Object.entries(t.activityOptions).map(([key, label]) => (
                      <option key={key} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pbp-comment"
                    className="mb-2 block text-small font-medium text-ink"
                  >
                    {t.commentLabel}
                  </label>
                  <textarea
                    id="pbp-comment"
                    name="comment"
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={t.commentPlaceholder}
                    className="w-full rounded-md border border-line-light px-4 py-3 text-body text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Booking */}
            <div className="rounded-[32px] bg-white p-6 sm:p-8">
              <h3 className="mb-6 font-display text-h4 font-bold text-ink">{t.bookingHeading}</h3>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label={t.nav.prevMonth}
                      disabled={isFirstNavigableMonth}
                      onClick={() =>
                        setVisibleMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-pill text-ink/60 hover:bg-surface-light disabled:pointer-events-none disabled:opacity-30"
                    >
                      ‹
                    </button>
                    <span className="text-small font-medium text-ink">
                      {t.calendar.monthsNominative[visibleMonth.getMonth()]}{' '}
                      {visibleMonth.getFullYear()}
                    </span>
                    <button
                      type="button"
                      aria-label={t.nav.nextMonth}
                      disabled={isLastNavigableMonth}
                      onClick={() =>
                        setVisibleMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-pill text-ink/60 hover:bg-surface-light disabled:pointer-events-none disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {t.calendar.weekdaysShort.map((label, index) => (
                      <span key={`${label}-${index}`} className="text-xs text-ink/50">
                        {label}
                      </span>
                    ))}
                    {monthGrid.map(({ date: cellDate, inMonth }) => {
                      const disabled = !inMonth || cellDate < today || cellDate > maxDate;
                      const isSelected =
                        selectedDate && dateKey(cellDate) === dateKey(selectedDate);
                      return (
                        <button
                          key={dateKey(cellDate)}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDate(cellDate);
                            setSelectedTime(null);
                          }}
                          className={`aspect-square rounded-pill text-small transition-colors ${
                            isSelected
                              ? 'bg-ink text-white'
                              : !inMonth
                                ? 'text-ink/20'
                                : disabled
                                  ? 'text-ink/25'
                                  : 'text-ink hover:bg-surface-light'
                          }`}
                        >
                          {cellDate.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex w-20 shrink-0 flex-col">
                  <span className="mb-2 text-small font-medium text-ink">{t.timeSlotsLabel}</span>
                  {selectedDate ? (
                    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                      {FIXED_TIMES.map((time) => {
                        const matched = slotForTime(time);
                        const taken = matched ? !matched.open : false;
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={taken}
                            onClick={() => setSelectedTime(time)}
                            className={`shrink-0 rounded-pill border px-2 py-1.5 text-xs transition-colors ${
                              isSelected
                                ? 'border-accent bg-accent text-neutral-900'
                                : taken
                                  ? 'border-line-light text-ink/30 line-through'
                                  : 'border-line-light text-ink hover:border-ink'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-ink/50">{t.noTimes}</p>
                  )}
                </div>
              </div>
              {slotError && <p className="mt-2 text-small text-accent">{t.errors.slotRequired}</p>}

              <div className="mt-6">
                <label htmlFor="pbp-format" className="mb-2 block text-small font-medium text-ink">
                  {t.formatLabel}
                </label>
                <select
                  id="pbp-format"
                  value={meetingFormat}
                  onChange={(event) => setMeetingFormat(event.target.value as MeetingFormat)}
                  className="h-12 w-full rounded-md border border-line-light bg-white px-4 text-body text-ink outline-none focus:border-accent"
                >
                  {(['ONLINE', 'OFFICE', 'OTHER'] as const).map((format) => (
                    <option key={format} value={format}>
                      {formatEmoji[format]}{' '}
                      {t.formatOptions[format.toLowerCase() as 'online' | 'office' | 'other']}
                    </option>
                  ))}
                </select>
              </div>

              {meetingFormat === 'OFFICE' && (
                <div className="mt-4">
                  <label
                    htmlFor="pbp-branch"
                    className="mb-2 block text-small font-medium text-ink"
                  >
                    {t.branchLabel}
                  </label>
                  <select
                    id="pbp-branch"
                    value={branchId}
                    onChange={(event) => setBranchId(event.target.value)}
                    className="h-12 w-full rounded-md border border-line-light bg-white px-4 text-body text-ink outline-none focus:border-accent"
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {meetingFormat === 'OTHER' && (
                <div className="mt-4">
                  <label
                    htmlFor="pbp-address"
                    className="mb-2 block text-small font-medium text-ink"
                  >
                    {t.addressLabel}
                  </label>
                  <input
                    id="pbp-address"
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                  />
                </div>
              )}

              {summaryLine && <p className="mt-6 text-small font-medium text-ink">{summaryLine}</p>}
              {status === 'conflict' && (
                <p className="mt-2 text-small text-accent">{t.errors.slotTaken}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" className="text-ink" onClick={onClose}>
              {t.close}
            </Button>
            <Button type="submit" variant="primary" disabled={status === 'submitting' || !isValid}>
              {status === 'submitting' ? t.sending : t.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
