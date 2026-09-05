'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import { detectDevice, submitLead } from '@/lib/leads';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';

type Status = 'idle' | 'submitting' | 'success';

const TOPIC_KEYS = ['usa', 'china', 'machinery', 'financing', 'partnership', 'other'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact `/contact` S1 right column (`references/pages.md` "8. Contact"
 * S1): a **static** form — unlike every other lead entry point on the site,
 * submitting stays on the page (no `UniversalPopup`/`QuizPopup`), matching
 * Figma node `141:600` (file `9Lq4XpWusTJj1VnM6laAZr`) exactly: Անուն, Էլ.
 * հասցե, Հեռախոսահամար, Թեմա dropdown, one submit button.
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
      <div role="status" aria-live="polite" className="rounded-xl bg-white p-8 shadow-card">
        <h2 className="font-display text-h3 font-bold text-ink">{t.successHeading}</h2>
        <p className="mt-3 text-body text-ink/80">
          {interpolate(t.successTemplate, { name: successName })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-card" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-small font-medium text-ink">
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
            className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
          />
          {nameError && (
            <p id="contact-name-error" className="mt-1 text-small text-accent">
              {t.errors.nameRequired}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block text-small font-medium text-ink">
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
            className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
          />
          {emailError && (
            <p id="contact-email-error" className="mt-1 text-small text-accent">
              {t.errors.emailInvalid}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-phone" className="mb-1 block text-small font-medium text-ink">
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
            className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
          />
          {phoneError && (
            <p id="contact-phone-error" className="mt-1 text-small text-accent">
              {t.errors.phoneInvalid}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-topic" className="mb-1 block text-small font-medium text-ink">
            {t.topicLabel}
          </label>
          <select
            id="contact-topic"
            name="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value as (typeof TOPIC_KEYS)[number])}
            className="h-12 w-full rounded-md border border-line-light bg-white px-4 text-body text-ink outline-none focus:border-accent"
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
      </div>

      <div className="mt-4">
        <label htmlFor="contact-comment" className="mb-1 block text-small font-medium text-ink">
          {t.commentLabel}
        </label>
        <textarea
          id="contact-comment"
          name="comment"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t.commentPlaceholder}
          className="w-full rounded-md border border-line-light px-4 py-3 text-body text-ink outline-none focus:border-accent"
        />
      </div>

      <Button type="submit" variant="primary" className="mt-6" disabled={status === 'submitting'}>
        {status === 'submitting' ? t.sending : t.submit}
      </Button>
    </form>
  );
}
