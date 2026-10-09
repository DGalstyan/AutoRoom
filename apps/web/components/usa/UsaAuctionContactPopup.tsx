'use client';

import { useId, useRef, useState } from 'react';
import { Dialog, DIALOG_BODY, DIALOG_FOOTER, DIALOG_HEADER } from '@/components/ui/Dialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { Button } from '@/components/ui/Button';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import { buildLeadHidden, submitLead } from '@/lib/leads';
import type { LeadFinancing } from '@/lib/leads';
import { LeadQualification, type QualificationValues } from '@/components/shared/LeadQualification';
import { interpolate } from '@/lib/messages';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';

export interface UsaAuctionContactPopupProps {
  open: boolean;
  onClose: () => void;
  sourcePage: string;
  sourceCta: string;
}

type Status = 'idle' | 'submitting' | 'success';

/**
 * The USA auction "Contact us" popup — Figma node 242:1345 ("USA popup"),
 * a page distinct from the 11-step import-process frame: a single-screen
 * form (not the Universal popup's 3-step wizard), shown when a visitor
 * wants help with a specific Copart/IAAI/Manheim auction car after being
 * pointed at AutoRoom's View Only (Guest Login) viewing account (the
 * subtitle copy below, pulled verbatim from the Figma frame, explains
 * exactly that flow — this is the "Կապ հաստատիր մեզ հետ" popup named in
 * the skill's auction-logic notes, now built to its own real design rather
 * than reusing Universal popup's generic chip wizard).
 *
 * Fields match the Figma frame exactly: name, phone, a free-text car
 * link/lot-number field, a free-text budget field (a raw AMD amount, not
 * Universal popup's fixed budget-bucket chips), a financing-needed toggle
 * (on/off, not the three-way need/no/unsure chip set), and a comment.
 * Two deliberate departures from the literal Figma frame, both because
 * reproducing them exactly would mean either fabricating a made-up format
 * or shipping an evident authoring slip in the source file itself:
 *  - The phone field's Figma placeholder is a generic "(123) 456 - 789"
 *    with no live mask; this reuses the same `+374 XX XXX XXX` mask and
 *    `formatArmenianPhone`/`isValidArmenianPhone` validation every other
 *    phone field on the site already uses (`UniversalPopup`), since that
 *    behavior is a deliberate, tested app-wide convention, not something
 *    this one screen should quietly do differently.
 *  - The comment field's Figma placeholder is "129000000 AMD" — literally
 *    the budget field's own placeholder, copy-pasted onto the wrong field
 *    in the source file (the two fields even use the same component
 *    instance). Left blank here rather than reproducing that or inventing
 *    a substitute placeholder.
 * The financing toggle's Figma default is ON, reproduced as this popup's
 * initial state.
 *
 * Locale: unlike `UniversalPopup` (which hardcodes `hidden.locale: 'hy'` —
 * a pre-existing quirk out of scope to fix here), this new popup reads the
 * real active locale via `useLocale()`, since there is no existing
 * behavior here to preserve.
 *
 * No per-car auction-listing component exists in this codebase yet to
 * attach a real "Կապ հաստատիր մեզ հետ" button to, so in the meantime this
 * opens from the page's two "already have a car in mind" CTAs instead of
 * the Universal popup — `UsaImportProcess`'s closing CTA and `UsaFinalCta`
 * (see each one's own doc comment for why). `UsaHero`'s top-of-page CTA
 * stays on the Universal popup for undirected intent. Reachable via
 * `useLeadWidgets().openUsaAuctionPopup({ sourceCta })` from anywhere else
 * that needs it too, e.g. a future auction-card component.
 */
export function UsaAuctionContactPopup({
  open,
  onClose,
  sourcePage,
  sourceCta,
}: UsaAuctionContactPopupProps) {
  const t = useMessages().usa.auctionPopup;
  const locale = useLocale();
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+374 ');
  const [carLink, setCarLink] = useState('');
  // Quick one-tap answers (shared with the Universal popup). Financing starts
  // on "need" — the Figma frame's default-ON toggle, kept as the default chip.
  const [qualification, setQualification] = useState<QualificationValues>({ financing: 'need' });
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [successName, setSuccessName] = useState('');

  // Reset on every (re)open — same pattern as `UniversalPopup`'s own doc
  // comment explains (adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName('');
      setPhone('+374 ');
      setCarLink('');
      setQualification({ financing: 'need' });
      setComment('');
      setTouched(false);
      setStatus('idle');
    }
  }

  const isValid = name.trim().length > 0 && isValidArmenianPhone(phone);
  const nameError = touched && name.trim().length === 0;
  const phoneError = touched && !isValidArmenianPhone(phone);

  async function handleSubmit() {
    if (!isValid) {
      setTouched(true);
      return;
    }
    setStatus('submitting');
    await submitLead({
      answers: {
        name: name.trim(),
        phone,
        carLink: carLink.trim() || undefined,
        budget: qualification.budget,
        financing: qualification.financing as LeadFinancing | undefined,
        timing: qualification.timing,
        channel: qualification.channel,
        comment: comment.trim() || undefined,
      },
      hidden: buildLeadHidden({ sourcePage, sourceCta, locale }),
    });
    setSuccessName(name.trim());
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <SuccessDialog
        open={open}
        onClose={onClose}
        heading={t.successHeading}
        body={interpolate(t.successTemplate, { name: successName })}
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
      fixedLayout
      closeOnOverlay={false}
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className={DIALOG_HEADER}>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-h3 font-bold text-ink outline-none"
          >
            {t.title}
          </h2>
          <p className="mt-2 text-small text-ink/70">{t.subtitle}</p>
        </div>

        <div className={DIALOG_BODY}>
          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="uap-name" className="mb-1 block text-small font-medium text-ink">
                {t.nameLabel}
              </label>
              <input
                id="uap-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={nameError}
                aria-describedby={nameError ? 'uap-name-error' : undefined}
                placeholder={t.namePlaceholder}
                className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
              />
              {nameError && (
                <p id="uap-name-error" className="mt-1 text-small text-accent">
                  {t.errors.nameRequired}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="uap-phone" className="mb-1 block text-small font-medium text-ink">
                {t.phoneLabel}
              </label>
              <input
                id="uap-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(formatArmenianPhone(event.target.value))}
                onBlur={() => setTouched(true)}
                aria-invalid={phoneError}
                aria-describedby={phoneError ? 'uap-phone-error' : undefined}
                className="h-12 w-full rounded-pill border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
              />
              {phoneError && (
                <p id="uap-phone-error" className="mt-1 text-small text-accent">
                  {t.errors.phoneInvalid}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="uap-car-link" className="mb-1 block text-small font-medium text-ink">
                {t.carLinkLabel}
              </label>
              <input
                id="uap-car-link"
                name="carLink"
                type="text"
                value={carLink}
                onChange={(event) => setCarLink(event.target.value)}
                placeholder={t.carLinkPlaceholder}
                className="h-12 w-full rounded-md border border-line-light px-4 text-body text-ink outline-none focus:border-accent"
              />
            </div>

            <LeadQualification
              values={qualification}
              onChange={(patch) => setQualification((prev) => ({ ...prev, ...patch }))}
              labels={{ budget: t.budgetLabel, financing: t.financingLabel }}
            />

            <div>
              <label htmlFor="uap-comment" className="mb-1 block text-small font-medium text-ink">
                {t.commentLabel}
              </label>
              <textarea
                id="uap-comment"
                name="comment"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t.commentPlaceholder}
                className="w-full rounded-md border border-line-light px-4 py-3 text-body text-ink outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className={DIALOG_FOOTER}>
          <Button type="button" variant="tertiary" className="text-ink" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" variant="primary" disabled={status === 'submitting'}>
            {status === 'submitting' ? t.sending : t.submit}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
