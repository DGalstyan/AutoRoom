'use client';

import { useState } from 'react';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import { detectDevice, submitLead } from '@/lib/leads';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';

type Status = 'idle' | 'submitting' | 'success';

const TOPIC_KEYS = ['usa', 'china', 'machinery', 'financing', 'partnership', 'other'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shared field styling — pixel-matched to Figma node `141:636` (file
 * `9Lq4XpWusTJj1VnM6laAZr`, verified via get_design_context): a borderless
 * 72px-tall pill with a `neutral-25` (#fafafa) fill, not the 48px
 * bordered-white-box `rounded-md` inputs this used to have.
 */
const FIELD_CLASSES =
  'h-[72px] w-full rounded-pill bg-neutral-25 px-6 text-[16px] leading-6 text-ink outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent';
const LABEL_CLASSES = 'mb-2 block text-[16px] font-medium leading-5 text-neutral-800';

/**
 * Contact `/contact` S1 right column (`references/pages.md` "8. Contact"
 * S1): a **static** form — unlike every other lead entry point on the site,
 * submitting stays on the page (no `UniversalPopup`/`QuizPopup`), matching
 * Figma node `141:636` (file `9Lq4XpWusTJj1VnM6laAZr`, "Form Wrapper").
 *
 * Pixel-audit fix (verified via get_design_context, not just the earlier
 * Dev-Mode-only pass): the real field order is Անուն (full width) →
 * [Հեռախոսահամար | Էլ. հասցե] paired → Թեմա (full width), not this
 * component's old symmetric 2×2 grid — and the submit button is a 60px
 * gold (`bg-accent`) pill with dark text, not the shared `Button`
 * component's white-text 44px default (used nowhere else with a gold fill
 * like this, so it's rebuilt inline here to match rather than adapted).
 *
 * The spec also names a "Մեկնաբանություն" (comment) textarea that this
 * particular Figma mock doesn't show — added anyway since it's explicit,
 * reviewed copy and a comment field is a low-risk, expected part of any
 * contact form; Figma here is treated as incomplete on this point rather
 * than authoritative.
 *
 * Still goes through the shared `submitLead` adapter with full hidden
 * context (source page/CTA, timestamp, locale, device), same as every other
 * lead on the site — "static form" only means no popup UI, not a different
 * submission pipeline.
 */
export function ContactForm() {
  const t = useMessages().contact.form;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+374 ');
  const [topic, setTopic] = useState<(typeof TOPIC_KEYS)[number] | ''>('');
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [successName, setSuccessName] = useState('');

  const nameError = touched && name.trim().length === 0;
  const phoneError = touched && !isValidArmenianPhone(phone);
  const emailError = touched && email.trim().length > 0 && !EMAIL_RE.test(email.trim());
  const isValid = name.trim().length > 0 && isValidArmenianPhone(phone) && !emailError;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) {
      setTouched(true);
      return;
    }
    setStatus('submitting');
    await submitLead({
      answers: {
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        topic: topic ? t.topicOptions[topic] : undefined,
        comment: comment.trim() || undefined,
      },
      hidden: {
        sourcePage: '/contact',
        sourceCta: 'contact-s1-form',
        timestamp: new Date().toISOString(),
        locale: 'hy',
        device: detectDevice(),
      },
    });
    setSuccessName(name.trim());
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div role="status" aria-live="polite" className="rounded-xl bg-white p-9 shadow-card">
        <h2 className="font-display text-h3 font-bold text-ink">{t.successHeading}</h2>
        <p className="mt-3 text-body text-ink/80">
          {interpolate(t.successTemplate, { name: successName })}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-9 shadow-card sm:p-10"
      noValidate
    >
      <div className="flex flex-col gap-8">
        <div>
          <label htmlFor="contact-name" className={LABEL_CLASSES}>
            {t.nameLabel}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={nameError}
            aria-describedby={nameError ? 'contact-name-error' : undefined}
            placeholder={t.namePlaceholder}
            className={FIELD_CLASSES}
          />
          {nameError && (
            <p id="contact-name-error" className="mt-1 text-small text-accent">
              {t.errors.nameRequired}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-phone" className={LABEL_CLASSES}>
              {t.phoneLabel}
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(formatArmenianPhone(event.target.value))}
              onBlur={() => setTouched(true)}
              aria-invalid={phoneError}
              aria-describedby={phoneError ? 'contact-phone-error' : undefined}
              className={FIELD_CLASSES}
            />
            {phoneError && (
              <p id="contact-phone-error" className="mt-1 text-small text-accent">
                {t.errors.phoneInvalid}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className={LABEL_CLASSES}>
              {t.emailLabel}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={emailError}
              aria-describedby={emailError ? 'contact-email-error' : undefined}
              placeholder={t.emailPlaceholder}
              className={FIELD_CLASSES}
            />
            {emailError && (
              <p id="contact-email-error" className="mt-1 text-small text-accent">
                {t.errors.emailInvalid}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="contact-topic" className={LABEL_CLASSES}>
            {t.topicLabel}
          </label>
          <select
            id="contact-topic"
            name="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value as (typeof TOPIC_KEYS)[number])}
            className={`${FIELD_CLASSES} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22 fill=%22none%22><path d=%22M4 6l4 4 4-4%22 stroke=%22%23999EA1%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:16px] bg-[position:right_24px_center] bg-no-repeat pr-12`}
          >
            <option value="" disabled>
              {t.topicPlaceholder}
            </option>
            {TOPIC_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.topicOptions[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Not in this Figma mock (see file-top comment) — kept as-is, same field styling. */}
        <div>
          <label htmlFor="contact-comment" className={LABEL_CLASSES}>
            {t.commentLabel}
          </label>
          <textarea
            id="contact-comment"
            name="comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t.commentPlaceholder}
            className="w-full rounded-xl bg-neutral-25 px-6 py-4 text-[16px] leading-6 text-ink outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* 60px gold pill, dark text — Figma's own `BTN` instance here, not
            the shared `Button` component's 44px/white-text default. */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex h-[60px] w-fit shrink-0 items-center justify-center gap-1 self-start rounded-pill bg-accent px-6 text-[14px] font-medium leading-5 text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {status === 'submitting' ? (
            t.sending
          ) : (
            <>
              {t.submit}
              <ArrowUpRightIcon className="size-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
