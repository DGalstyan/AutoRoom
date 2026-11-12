'use client';

import { useId, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';
import { buildLeadHidden, submitLead } from '@/lib/leads';
import { interpolate } from '@/lib/messages';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';

export interface UsaAuctionContactPopupProps {
  open: boolean;
  onClose: () => void;
  sourcePage: string;
  sourceCta: string;
  /** The car page the visitor came from — pre-fills the car link / lot number field. */
  carRef?: string;
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
  carRef = '',
}: UsaAuctionContactPopupProps) {
  const t = useMessages().usa.auctionPopup;
  const locale = useLocale();
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+374 ');
  const [carLink, setCarLink] = useState('');
  // Figma 478:1489: the budget is a free-text field and financing a switch that starts ON.
  const [budget, setBudget] = useState('');
  const [needFinancing, setNeedFinancing] = useState(true);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const [failed, setFailed] = useState(false);
  const popupT = useMessages().common.popup;
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
      setCarLink(carRef);
      setBudget('');
      setNeedFinancing(true);
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
    setFailed(false);
    setStatus('submitting');
    const result = await submitLead({
      answers: {
        name: name.trim(),
        phone,
        carLink: carLink.trim() || undefined,
        budget: budget.trim() || undefined,
        financing: needFinancing ? 'need' : 'no',
        comment: comment.trim() || undefined,
      },
      hidden: buildLeadHidden({ sourcePage, sourceCta, locale }),
    });
    if (!result.ok) {
      setFailed(true);
      setStatus('idle');
      return;
    }
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

  const field =
    'h-[72px] w-full rounded-[50px] bg-neutral-25 px-6 text-[16px] leading-6 text-ink outline-none placeholder:text-[#999ea1] focus:ring-2 focus:ring-accent aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error';
  const label = 'text-[16px] font-medium leading-5 text-neutral-800';
  const pill =
    'inline-flex h-12 items-center justify-center rounded-pill px-6 text-[14px] font-bold leading-5 text-ink transition-colors duration-standard';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      titleId={titleId}
      closeLabel={t.close}
      closeOnOverlay={false}
      panelClassName="max-w-[568px] rounded-[30px] p-6 sm:p-9"
      closeButtonClassName="right-3 top-3"
    >
      <form
        className="flex flex-col gap-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {/* Figma 478:1491 — 20/32 bold title and a 14/18 intro, then 24px between the blocks. */}
        <div className="flex flex-col gap-2 pr-10">
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[20px] font-bold leading-8 text-[#0f1b33] outline-none"
          >
            {t.title}
          </h2>
          <p className="text-[14px] leading-[18px] text-black">{t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="uap-name" className={label}>
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
            className={field}
          />
          {nameError && (
            <p id="uap-name-error" className="text-small text-error">
              {t.errors.nameRequired}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="uap-phone" className={label}>
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
            className={field}
          />
          {phoneError && (
            <p id="uap-phone-error" className="text-small text-error">
              {t.errors.phoneInvalid}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="uap-car-link" className={label}>
            {t.carLinkLabel}
          </label>
          <input
            id="uap-car-link"
            name="carLink"
            type="text"
            value={carLink}
            onChange={(event) => setCarLink(event.target.value)}
            placeholder={t.carLinkPlaceholder}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="uap-budget" className={label}>
            {t.budgetLabel}
          </label>
          <input
            id="uap-budget"
            name="budget"
            type="text"
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(event.target.value.slice(0, 40))}
            placeholder={t.budgetPlaceholder}
            className={field}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span id="uap-financing-label" className={label}>
            {t.financingLabel}
          </span>
          {/* Figma 478:1608: a 45×28 switch, dark when ON, with a 26px knob. */}
          <button
            type="button"
            role="switch"
            aria-checked={needFinancing}
            aria-labelledby="uap-financing-label"
            onClick={() => setNeedFinancing((value) => !value)}
            className={`flex h-7 w-[45px] shrink-0 items-center rounded-[16px] p-[2px] transition-colors duration-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              needFinancing ? 'justify-end bg-neutral-800' : 'justify-start bg-neutral-100'
            }`}
          >
            <span className="size-[24px] rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="uap-comment" className={label}>
            {t.commentLabel}
          </label>
          <textarea
            id="uap-comment"
            name="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t.commentPlaceholder}
            className="h-[146px] w-full resize-none rounded-[50px] bg-neutral-25 px-6 py-6 text-[16px] leading-6 text-ink outline-none placeholder:text-[#999ea1] focus:ring-2 focus:ring-accent"
          />
        </div>

        {failed && (
          <p role="alert" className="text-small text-error">
            {popupT.sendFailed}
          </p>
        )}

        <div className="flex items-start justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`${pill} bg-neutral-50 hover:bg-neutral-100`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className={`${pill} bg-accent hover:bg-accent-600 disabled:opacity-60`}
          >
            {status === 'submitting' ? t.sending : failed ? popupT.retry : t.submit}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
