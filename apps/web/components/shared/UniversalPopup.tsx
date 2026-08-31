'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/Dialog';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import {
  CHANNEL_INSTRUMENTAL,
  detectDevice,
  submitLead,
  type LeadBudget,
  type LeadChannel,
  type LeadFinancing,
  type LeadInterest,
  type LeadTiming,
} from '@/lib/leads';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';

export interface UniversalPopupCarContext {
  name: string;
  vin?: string;
  price?: string;
  image?: string;
  url: string;
  /** Order-only colour choices for this car (per-car variant only). */
  colors?: string[];
}

export interface UniversalPopupProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select depending on where the popup opened from. */
  preselect?: Partial<{ interest: LeadInterest; budget: LeadBudget }>;
  /** Locks a read-only car card at the top — the per-car variant. */
  car?: UniversalPopupCarContext;
  sourcePage: string;
  sourceCta: string;
  /** Extra text appended into the Step-3 comment (e.g. quiz answers summary). */
  prefilledComment?: string;
  /** If this popup followed the Quiz, its answers ride along in the hidden payload. */
  quizAnswers?: Record<string, string>;
}

type Step = 1 | 2 | 3;
type Status = 'idle' | 'submitting' | 'success';

const INTEREST_KEYS: LeadInterest[] = ['usa', 'china', 'in-stock', 'undecided'];
const BUDGET_KEYS: LeadBudget[] = ['lt10k', '10-20k', '20-35k', '35k+'];
const FINANCING_KEYS: LeadFinancing[] = ['need', 'no', 'unsure'];
const TIMING_KEYS: LeadTiming[] = ['now', '1-3m', 'browsing'];
const CHANNEL_KEYS: LeadChannel[] = ['call', 'whatsapp', 'viber', 'telegram'];

export function UniversalPopup({
  open,
  onClose,
  preselect,
  car,
  sourcePage,
  sourceCta,
  prefilledComment,
  quizAnswers,
}: UniversalPopupProps) {
  const t = useMessages().common.popup;
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+374 ');
  const [touched, setTouched] = useState(false);
  const [interest, setInterest] = useState<LeadInterest | undefined>(preselect?.interest);
  const [budget, setBudget] = useState<LeadBudget | undefined>(preselect?.budget);
  const [financing, setFinancing] = useState<LeadFinancing | undefined>();
  const [timing, setTiming] = useState<LeadTiming | undefined>();
  const [channel, setChannel] = useState<LeadChannel | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [successName, setSuccessName] = useState('');
  const [successChannel, setSuccessChannel] = useState<LeadChannel | undefined>();

  // Reset on every (re)open so a closed-then-reopened popup starts fresh with
  // this open's pre-selection applied. Adjusted during render (React's
  // recommended pattern for "reset state when a prop changes") rather than in
  // an effect, so there is no extra render/flash of stale content.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(1);
      setName('');
      setPhone('+374 ');
      setTouched(false);
      setInterest(preselect?.interest);
      setBudget(preselect?.budget);
      setFinancing(undefined);
      setTiming(undefined);
      setChannel(undefined);
      setColor(undefined);
      setComment(prefilledComment ?? '');
      setStatus('idle');
    }
  }

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, status]);

  const isStep1Valid = name.trim().length > 0 && isValidArmenianPhone(phone);
  const phoneError = touched && !isValidArmenianPhone(phone);
  const nameError = touched && name.trim().length === 0;

  async function handleSubmit() {
    if (!isStep1Valid) {
      setTouched(true);
      setStep(1);
      return;
    }
    setStatus('submitting');
    const commentParts = [comment.trim()];
    if (color) commentParts.unshift(`${t.colorLabel}: ${color}`);
    await submitLead({
      answers: {
        name: name.trim(),
        phone,
        interest,
        budget,
        financing,
        timing,
        channel,
        comment: commentParts.filter(Boolean).join(' — ') || undefined,
        color,
      },
      hidden: {
        sourcePage,
        sourceCta,
        car: car ? { name: car.name, vin: car.vin } : undefined,
        timestamp: new Date().toISOString(),
        locale: 'hy',
        device: detectDevice(),
        quizAnswers,
      },
    });
    setSuccessName(name.trim());
    setSuccessChannel(channel);
    setStatus('success');
  }

  const successText = car
    ? interpolate(t.perCarSuccessTemplate, { name: successName, model: car.name })
    : interpolate(t.successTemplate, {
        name: successName,
        channel: successChannel ? CHANNEL_INSTRUMENTAL[successChannel] : t.successChannelDefault,
      });

  const dialogTitle = car ? interpolate(t.perCarTitle, { model: car.name }) : t.step1Title;

  return (
    <Dialog open={open} onClose={onClose} titleId={titleId} closeLabel={t.close}>
      {status === 'success' ? (
        <div role="status" aria-live="polite">
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-h3 font-bold text-ink outline-none"
          >
            {t.successHeading}
          </h2>
          <p className="mt-3 text-body text-ink/80">{successText}</p>
          <Button variant="primary" className="mt-6" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (step < 3) {
              if (step === 1 && !isStep1Valid) {
                setTouched(true);
                return;
              }
              setStep((step + 1) as Step);
              return;
            }
            void handleSubmit();
          }}
        >
          <p className="text-caption font-medium uppercase tracking-wide text-muted">
            {interpolate(t.step, { current: String(step), total: '3' })}
          </p>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-display text-h3 font-bold text-ink outline-none"
          >
            {step === 1 ? dialogTitle : step === 2 ? t.step2Title : t.step3Title}
          </h2>

          {car && (
            <div className="mt-4 flex items-center gap-3 rounded-md border border-line-light bg-surface-light p-3">
              {car.image ? (
                <Image
                  src={car.image}
                  alt=""
                  width={64}
                  height={48}
                  className="h-12 w-16 rounded-sm object-cover"
                />
              ) : (
                <div
                  className="h-12 w-16 shrink-0 rounded-sm bg-gradient-to-br from-ink to-muted"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="font-display font-semibold text-ink">{car.name}</p>
                {car.price && <p className="text-small text-muted">{car.price}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="up-name" className="mb-1 block text-small font-medium text-ink">
                  {t.nameLabel}
                </label>
                <input
                  id="up-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={nameError}
                  aria-describedby={nameError ? 'up-name-error' : undefined}
                  placeholder={t.namePlaceholder}
                  className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                />
                {nameError && (
                  <p id="up-name-error" className="mt-1 text-small text-accent">
                    {t.errors.nameRequired}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="up-phone" className="mb-1 block text-small font-medium text-ink">
                  {t.phoneLabel}
                </label>
                <input
                  id="up-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(formatArmenianPhone(event.target.value))}
                  onBlur={() => setTouched(true)}
                  aria-invalid={phoneError}
                  aria-describedby={phoneError ? 'up-phone-error' : undefined}
                  className="h-12 w-full rounded-pill border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
                />
                {phoneError && (
                  <p id="up-phone-error" className="mt-1 text-small text-accent">
                    {t.errors.phoneInvalid}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 space-y-5">
              <p className="text-small text-muted">{t.encouraging}</p>

              {car ? (
                car.colors &&
                car.colors.length > 0 && (
                  <ChipGroup
                    label={t.colorLabel}
                    options={car.colors.map((c) => ({ key: c, label: c }))}
                    value={color}
                    onChange={setColor}
                  />
                )
              ) : (
                <ChipGroup
                  label={t.interestLabel}
                  options={INTEREST_KEYS.map((key) => ({ key, label: t.interestOptions[key] }))}
                  value={interest}
                  onChange={(value) => setInterest(value as LeadInterest)}
                />
              )}

              <ChipGroup
                label={t.budgetLabel}
                options={BUDGET_KEYS.map((key) => ({ key, label: t.budgetOptions[key] }))}
                value={budget}
                onChange={(value) => setBudget(value as LeadBudget)}
              />
              <ChipGroup
                label={t.financingLabel}
                options={FINANCING_KEYS.map((key) => ({ key, label: t.financingOptions[key] }))}
                value={financing}
                onChange={(value) => setFinancing(value as LeadFinancing)}
              />
              {!car && (
                <ChipGroup
                  label={t.timingLabel}
                  options={TIMING_KEYS.map((key) => ({ key, label: t.timingOptions[key] }))}
                  value={timing}
                  onChange={(value) => setTiming(value as LeadTiming)}
                />
              )}
              <ChipGroup
                label={t.channelLabel}
                options={CHANNEL_KEYS.map((key) => ({ key, label: t.channelOptions[key] }))}
                value={channel}
                onChange={(value) => setChannel(value as LeadChannel)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="mt-4">
              <label htmlFor="up-comment" className="mb-1 block text-small font-medium text-ink">
                {t.commentLabel}
              </label>
              <textarea
                id="up-comment"
                name="comment"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t.commentPlaceholder}
                className="w-full rounded-md border border-line-light px-4 py-3 text-body text-ink outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="text-ink"
                onClick={() => setStep((step - 1) as Step)}
              >
                {t.back}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {step < 3 && (
                <Button
                  type="submit"
                  variant="outline"
                  className="border-line-light text-ink"
                  disabled={step === 1 && !isStep1Valid}
                >
                  {t.next}
                </Button>
              )}
              {(step > 1 || isStep1Valid) && (
                <Button
                  type="button"
                  variant="primary"
                  disabled={!isStep1Valid || status === 'submitting'}
                  onClick={() => void handleSubmit()}
                >
                  {status === 'submitting' ? t.sending : car ? t.submitPerCar : t.submit}
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function ChipGroup<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: K; label: string }[];
  value: K | undefined;
  onChange: (value: K) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-small font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.key}
            selected={value === option.key}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
