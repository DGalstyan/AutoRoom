'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
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

/** The daily template every branch's calendar offers —
 * `references/pages.md` §5 S5, verbatim. */
const FIXED_TIMES = ['10:00', '11:00', '12:30', '14:00', '15:30', '17:00'];

const MAX_DAYS_AHEAD = 60; // Matches `GET /public/availability`'s own clamp.

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Builds a Monday-first grid for `month` (a `Date` on any day of that
 * month); `null` cells pad out the leading/trailing days of neighbor
 * months. */
function buildMonthGrid(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstOfMonth = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  // getDay(): 0=Sun..6=Sat → shift to Monday-first (0=Mon..6=Sun).
  const leadingBlank = (firstOfMonth.getDay() + 6) % 7;

  const cells: (Date | null)[] = Array.from({ length: leadingBlank }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, m, day));
  }
  return cells;
}

/**
 * `/partners` S5 final CTA — the "Become a dealer" meeting-booking popup
 * (`references/pages.md` §5 S5, Figma node 291:53's `Become a dealer`
 * frame, file 9Lq4XpWusTJj1VnM6laAZr). Two sections: contact info (left on
 * desktop) and booking (calendar + fixed time chips + meeting-format
 * radio-cards, right on desktop) — both stack into one column on mobile.
 *
 * Deliberate simplification vs. the written spec: the spec additionally
 * describes a mobile-only 3-step wizard with its own progress bar
 * ("1 Տվյալներ → 2 Օր/ժամ → 3 Հաստատում"). Figma's own mockup only shows
 * the desktop two-column frame — no mobile wizard frame exists to verify
 * against — so this ships the same single scrollable form on every
 * breakpoint instead of fabricating step-transition behavior nobody has
 * actually designed. The `steps`/`nav` message keys are already in place
 * for whoever builds the real wizard later.
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
 * fetched per visible calendar month. A fixed daily chip counts as taken
 * only when a real `AvailabilitySlot` exists at that exact local time with
 * `open: false`; otherwise every fixed time is offered even on days no
 * admin has explicitly generated slots for yet (matching the spec's
 * "slots generated from team availability" as a capacity ceiling, not a
 * prerequisite for a lead to ask for a time). When a matching slot exists,
 * its id is sent as `meetingSlotId` so the API binds the exact time and can
 * 409 if it fills between load and submit; otherwise a plain `meetingAt`
 * is sent.
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
  const headingRef = useRef<HTMLHeadingElement>(null);

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      titleId={titleId}
      closeLabel={t.close}
      className="max-w-3xl"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-h3 font-bold text-ink outline-none"
        >
          {t.title}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Contact info */}
          <div className="space-y-4">
            <h3 className="text-small font-semibold uppercase tracking-wide text-ink/60">
              {t.contactHeading}
            </h3>

            <div>
              <label htmlFor="pbp-name" className="mb-1 block text-small font-medium text-ink">
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

            <div>
              <label htmlFor="pbp-phone" className="mb-1 block text-small font-medium text-ink">
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
              <label htmlFor="pbp-email" className="mb-1 block text-small font-medium text-ink">
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

            <div>
              <label htmlFor="pbp-company" className="mb-1 block text-small font-medium text-ink">
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
              <label htmlFor="pbp-activity" className="mb-1 block text-small font-medium text-ink">
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
              <label htmlFor="pbp-comment" className="mb-1 block text-small font-medium text-ink">
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

          {/* Booking */}
          <div className="space-y-4">
            <h3 className="text-small font-semibold uppercase tracking-wide text-ink/60">
              {t.bookingHeading}
            </h3>

            <div className="rounded-md border border-line-light p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  aria-label={t.nav.prevMonth}
                  disabled={isFirstNavigableMonth}
                  onClick={() =>
                    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
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
                    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
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
                {monthGrid.map((cellDate, index) => {
                  if (!cellDate) return <span key={`blank-${index}`} />;
                  const disabled = cellDate < today || cellDate > maxDate;
                  const isSelected = selectedDate && dateKey(cellDate) === dateKey(selectedDate);
                  return (
                    <button
                      key={dateKey(cellDate)}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDate(cellDate);
                        setSelectedTime(null);
                      }}
                      className={`h-8 rounded-pill text-small transition-colors ${
                        isSelected
                          ? 'bg-ink text-white'
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

            <div>
              <span className="mb-1 block text-small font-medium text-ink">{t.timeSlotsLabel}</span>
              {selectedDate ? (
                <div className="flex flex-wrap gap-2">
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
                        className={`rounded-pill border px-4 py-2 text-small transition-colors ${
                          isSelected
                            ? 'border-ink bg-ink text-white'
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
                <p className="text-small text-ink/50">{t.noTimes}</p>
              )}
              {slotError && <p className="mt-1 text-small text-accent">{t.errors.slotRequired}</p>}
            </div>

            <div>
              <span className="mb-1 block text-small font-medium text-ink">{t.formatLabel}</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['ONLINE', 'OFFICE', 'OTHER'] as const).map((format) => {
                  const label =
                    t.formatOptions[format.toLowerCase() as 'online' | 'office' | 'other'];
                  const isSelected = meetingFormat === format;
                  return (
                    <button
                      key={format}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setMeetingFormat(format)}
                      className={`rounded-md border px-3 py-2 text-small transition-colors ${
                        isSelected
                          ? 'border-ink bg-surface-light font-medium text-ink'
                          : 'border-line-light text-ink/70 hover:border-ink'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {meetingFormat === 'OFFICE' && (
              <div>
                <label htmlFor="pbp-branch" className="mb-1 block text-small font-medium text-ink">
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
              <div>
                <label htmlFor="pbp-address" className="mb-1 block text-small font-medium text-ink">
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

            {summaryLine && <p className="text-small font-medium text-ink">{summaryLine}</p>}
            {status === 'conflict' && (
              <p className="text-small text-accent">{t.errors.slotTaken}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" className="text-ink" onClick={onClose}>
            {t.close}
          </Button>
          <Button type="submit" variant="primary" disabled={status === 'submitting' || !isValid}>
            {status === 'submitting' ? t.sending : t.submit}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
