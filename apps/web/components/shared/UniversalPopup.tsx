'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button, Chip, ChipGroup, Dialog } from '@/components/ui';
import {
  BUDGET_OPTIONS,
  CHANNEL_INSTRUMENTAL,
  CHANNEL_OPTIONS,
  COLOR_OPTIONS,
  FINANCING_OPTIONS,
  INTEREST_OPTIONS,
  TIMING_OPTIONS,
  buildLeadPayload,
  submitLead,
  type ChipOption,
  type LeadAnswers,
  type LeadBudget,
  type LeadCarContext,
  type LeadInterest,
  type QuizContext,
} from '@/lib/lead';
import { PHONE_PREFIX, formatPhoneLocal, isValidPhone, normalizePhoneInput } from '@/lib/phone';
import { t, tf } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { CarColorId } from '@/types/car';

/**
 * The universal lead form — one component behind almost every "Ստանալ առաջարկ"
 * on the site. Two rules from the spec drive the whole design:
 *
 *  1. **Only 2 required fields** (name + phone). Steps 2 and 3 never block
 *     submission; the button unlocks the moment step 1 is valid.
 *  2. **Minimise typing.** Step 2 is chips and one dropdown, never free text.
 *
 * All three steps live on one scrollable screen rather than in a wizard — a
 * wizard would gate the submit behind "Next", which contradicts rule 1.
 *
 * Pages never render this directly: they call `openUniversal()` on
 * `LeadWidgetProvider` so the hidden context is attached in exactly one place.
 */

export interface UniversalPopupProps {
  open: boolean;
  onClose: () => void;
  /** Auto-attached hidden context. */
  sourcePage: string;
  sourceCta: string;
  /** Pre-checked step-2 chips (China page ⇒ "Մեքենա Չինաստանից" already on). */
  preselect?: Partial<{ interest: LeadInterest; budget: LeadBudget }>;
  /** Per-car variant: locks a read-only card at the top. */
  car?: LeadCarContext;
  /** Colour choice, order-only cars only. */
  colorOptions?: CarColorId[];
  /** Attached when the Quiz handed off to this popup. */
  quiz?: QuizContext;
}

type Status = 'idle' | 'sending' | 'error' | 'done';

export function UniversalPopup({
  open,
  onClose,
  sourcePage,
  sourceCta,
  preselect,
  car,
  colorOptions,
  quiz,
}: UniversalPopupProps) {
  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  // Pre-checked chips come straight from the initial props: `LeadWidgetProvider`
  // remounts this component on every open (see its `key`), so each lead starts
  // clean without an effect resetting state after the fact.
  const [answers, setAnswers] = useState<LeadAnswers>(() => ({
    interest: preselect?.interest,
    budget: preselect?.budget,
  }));
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean }>({});
  const [status, setStatus] = useState<Status>('idle');

  const successRef = useRef<HTMLParagraphElement>(null);
  const fieldId = useId();

  // The form is replaced on success, so focus has to be moved deliberately or it
  // falls back to the body and screen readers announce nothing.
  useEffect(() => {
    if (status === 'done') successRef.current?.focus();
  }, [status]);

  const nameValid = name.trim().length > 0;
  const phoneValid = isValidPhone(phoneDigits);
  const canSubmit = nameValid && phoneValid && status !== 'sending';

  function set<K extends keyof LeadAnswers>(key: K, value: LeadAnswers[K]) {
    // Chips toggle: tapping the selected one clears it (all of step 2 is optional).
    setAnswers((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ name: true, phone: true });
    if (!nameValid || !phoneValid) return;

    setStatus('sending');
    try {
      await submitLead(
        buildLeadPayload({ name, phoneDigits, answers, sourcePage, sourceCta, car, quiz }),
      );
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  const title = car
    ? tf('universalPopup.perCarTitle', { car: car.name })
    : t('common.cta.getOffer');

  return (
    <Dialog open={open} onClose={onClose} title={title} size="lg">
      {status === 'done' ? (
        <SuccessMessage ref={successRef} name={name} answers={answers} car={car} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
          {car ? <LockedCarCard car={car} /> : null}

          {/* Step 1 — the only required fields. */}
          <section className="flex flex-col gap-4">
            <StepLabel step={1} hint={t('universalPopup.requiredHint')} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id={`${fieldId}-name`}
                label={t('common.form.name')}
                error={touched.name && !nameValid ? t('universalPopup.errors.name') : undefined}
              >
                <input
                  id={`${fieldId}-name`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                  autoComplete="name"
                  required
                  aria-invalid={touched.name && !nameValid}
                  className={inputClass}
                />
              </Field>

              <Field
                id={`${fieldId}-phone`}
                label={t('common.form.phone')}
                error={touched.phone && !phoneValid ? t('universalPopup.errors.phone') : undefined}
              >
                {/* The +374 prefix is chrome, not an editable value — the field
                    holds the 8 local digits and formats them as they are typed.
                    The focus ring is moved to the wrapper (and suppressed on the
                    bare input) so focus does not read as an error state. */}
                <div
                  className={cn(
                    inputClass,
                    'flex items-center gap-2',
                    'focus-within:border-ink focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2',
                    touched.phone && !phoneValid && 'border-accent',
                  )}
                >
                  <span aria-hidden="true" className="text-muted">
                    {PHONE_PREFIX}
                  </span>
                  <input
                    id={`${fieldId}-phone`}
                    value={formatPhoneLocal(phoneDigits)}
                    onChange={(event) => setPhoneDigits(normalizePhoneInput(event.target.value))}
                    onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    aria-invalid={touched.phone && !phoneValid}
                    aria-describedby={`${fieldId}-phone-prefix`}
                    className="w-full bg-transparent outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <span id={`${fieldId}-phone-prefix`} className="sr-only">
                    {PHONE_PREFIX}
                  </span>
                </div>
              </Field>
            </div>
          </section>

          {/* Step 2 — optional, one screen, chips only. */}
          <section className="flex flex-col gap-5">
            <StepLabel step={2} hint={t('universalPopup.step2Encouragement')} optional />

            {car ? (
              <>
                {colorOptions?.length ? (
                  <ColorPicker
                    options={colorOptions}
                    value={answers.color}
                    onChange={(value) => setAnswers((current) => ({ ...current, color: value }))}
                  />
                ) : null}
                <ChipQuestion
                  label={t('universalPopup.questions.budget')}
                  options={BUDGET_OPTIONS}
                  value={answers.budget}
                  onSelect={(value) => set('budget', value)}
                />
                <ChipQuestion
                  label={t('universalPopup.questions.financing')}
                  options={FINANCING_OPTIONS}
                  value={answers.financing}
                  onSelect={(value) => set('financing', value)}
                />
              </>
            ) : (
              <>
                <ChipQuestion
                  label={t('universalPopup.questions.interest')}
                  options={INTEREST_OPTIONS}
                  value={answers.interest}
                  onSelect={(value) => set('interest', value)}
                />
                <ChipQuestion
                  label={t('universalPopup.questions.budget')}
                  options={BUDGET_OPTIONS}
                  value={answers.budget}
                  onSelect={(value) => set('budget', value)}
                />
                <ChipQuestion
                  label={t('universalPopup.questions.financing')}
                  options={FINANCING_OPTIONS}
                  value={answers.financing}
                  onSelect={(value) => set('financing', value)}
                />
                <ChipQuestion
                  label={t('universalPopup.questions.timing')}
                  options={TIMING_OPTIONS}
                  value={answers.timing}
                  onSelect={(value) => set('timing', value)}
                />
                <ChipQuestion
                  label={t('universalPopup.questions.channel')}
                  options={CHANNEL_OPTIONS}
                  value={answers.channel}
                  onSelect={(value) => set('channel', value)}
                />
              </>
            )}
          </section>

          {/* Step 3 — the one free-text field. */}
          <section className="flex flex-col gap-4">
            <StepLabel step={3} optional />
            <Field id={`${fieldId}-comment`} label={t('universalPopup.commentLabel')}>
              <textarea
                id={`${fieldId}-comment`}
                value={answers.comment ?? ''}
                onChange={(event) =>
                  setAnswers((current) => ({ ...current, comment: event.target.value }))
                }
                rows={3}
                maxLength={1000}
                className={cn(inputClass, 'resize-y')}
              />
            </Field>
          </section>

          {status === 'error' ? (
            <p role="alert" className="text-small font-medium text-accent">
              {t('universalPopup.errors.submit')}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
            {status === 'sending'
              ? t('universalPopup.sending')
              : car
                ? t('common.cta.sendRequest')
                : t('common.cta.send')}
          </Button>
        </form>
      )}
    </Dialog>
  );
}

const inputClass =
  'w-full rounded-md border border-line-light bg-paper px-4 py-3 text-body text-ink ' +
  'transition-colors duration-micro placeholder:text-muted focus:border-ink focus:outline-none';

function StepLabel({ step, hint, optional }: { step: number; hint?: string; optional?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-pill bg-ink text-caption font-bold text-paper">
        {step}
      </span>
      {hint ? <span className="text-small text-muted">{hint}</span> : null}
      {optional ? (
        <span className="text-caption text-muted">({t('common.form.optional')})</span>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-caption font-medium text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChipQuestion<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
}) {
  return (
    <ChipGroup label={label}>
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onClick={() => onSelect(option.value)}
        >
          {t(option.labelKey)}
        </Chip>
      ))}
    </ChipGroup>
  );
}

/** Colour swatches for order-only cars. Rendered as a radio group, not a native
 *  `<select>`, so the actual colour is visible while choosing. */
function ColorPicker({
  options,
  value,
  onChange,
}: {
  options: CarColorId[];
  value: CarColorId | undefined;
  onChange: (value: CarColorId | undefined) => void;
}) {
  const available = COLOR_OPTIONS.filter((option) => options.includes(option.value));

  return (
    <ChipGroup label={t('common.form.preferredColor')}>
      {available.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onClick={() => onChange(value === option.value ? undefined : option.value)}
        >
          <span
            aria-hidden="true"
            style={{ backgroundColor: option.hex }}
            className="h-4 w-4 rounded-pill border border-line-light"
          />
          {t(option.labelKey)}
        </Chip>
      ))}
    </ChipGroup>
  );
}

function LockedCarCard({ car }: { car: LeadCarContext }) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-line-light bg-surface-light p-3">
      {car.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- lead payload carries a plain URL, not a static import
        <img src={car.image} alt="" className="h-16 w-24 flex-none rounded-sm object-cover" />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-body font-semibold">{car.name}</p>
        {car.price ? <p className="text-small text-muted">{car.price}</p> : null}
        {car.vin ? (
          <p className="text-caption text-muted">
            {t('car.spec.vin')}: {car.vin}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SuccessMessage({
  ref,
  name,
  answers,
  car,
}: {
  ref: React.Ref<HTMLParagraphElement>;
  name: string;
  answers: LeadAnswers;
  car?: LeadCarContext;
}) {
  const detail = car
    ? tf('universalPopup.success.perCar', { car: car.name })
    : answers.channel
      ? tf('universalPopup.success.channel', { channel: t(CHANNEL_INSTRUMENTAL[answers.channel]) })
      : t('universalPopup.success.default');

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span
        aria-hidden="true"
        className="bg-success/12 flex h-14 w-14 items-center justify-center rounded-pill text-success"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7">
          <path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p ref={ref} tabIndex={-1} className="text-h3 outline-none">
        {tf('universalPopup.success.thanks', { name: name.trim() })}
      </p>
      <p className="max-w-md text-body text-muted">{detail}</p>
    </div>
  );
}
