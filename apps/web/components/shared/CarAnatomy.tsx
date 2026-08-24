'use client';

import { useId, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useScrollProgress } from '@/lib/hooks/useScrollProgress';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { Button } from '@/components/ui/Button';
import { messages } from '@/lib/messages';

const t = messages.home.anatomy;
const hotspots = messages.common.carAnatomy.hotspots;

// Approximate positions around the placeholder hero silhouette (percent of
// the sticky stage). TODO: recalibrate once the real exploded-view asset lands.
const POSITIONS = [
  { top: '58%', left: '20%' }, // Շարժիչ
  { top: '42%', left: '50%' }, // Թափք
  { top: '80%', left: '35%' }, // Անիվներ
  { top: '50%', left: '68%' }, // Դռներ
  { top: '26%', left: '50%' }, // Ղեկ
  { top: '46%', left: '80%' }, // Լուսարձակներ
  { top: '18%', left: '85%' }, // Փաստաթղթապանակ
  { top: '78%', left: '80%' }, // Բանալի
];

const SOURCE_CTA = 'home-anatomy-final-cta';

export function CarAnatomy() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef, { disabled: reducedMotion });
  const { openUniversal } = useLeadWidgets();

  const visibleCount = reducedMotion
    ? hotspots.length
    : Math.floor(progress * (hotspots.length + 1));
  const isFinal = reducedMotion || progress >= 0.95;

  function openOffer() {
    openUniversal({ sourceCta: SOURCE_CTA });
  }

  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wide text-accent">{t.eyebrow}</p>
      <h2 className="mt-2 font-display text-h2 font-bold text-white">{t.heading}</h2>

      {/* Desktop: scroll-driven exploded view. Hidden below `lg`, where the
          interaction collapses to a static hero + chip list (below). */}
      <div ref={sectionRef} className="relative mt-10 hidden lg:block lg:h-[320vh]">
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          <div className="relative aspect-[16/9] w-full max-w-4xl">
            <div
              className="absolute inset-0 rounded-lg bg-gradient-to-br from-surface via-bg to-surface"
              aria-hidden="true"
            >
              {/* TODO: replace with the real AI-generated exploded-view hero asset */}
              <div className="flex h-full items-center justify-center text-white/20">
                <CarSilhouette />
              </div>
            </div>

            {hotspots.map((hotspot, index) => (
              <Hotspot
                key={hotspot.title}
                title={hotspot.title}
                text={hotspot.text}
                position={POSITIONS[index]}
                visible={index < visibleCount && !isFinal}
              />
            ))}

            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-6 text-center transition-opacity duration-entrance ease-expo ${
                isFinal ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <p className="max-w-md font-display text-h3 font-bold text-white">{t.finalLine}</p>
              <Button variant="primary" onClick={openOffer}>
                {t.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / reduced-motion: static hero + vertical chip list, no scroll-scrubbing. */}
      <div className="mt-8 lg:hidden">
        <div
          className="flex aspect-video w-full items-center justify-center rounded-lg bg-gradient-to-br from-surface via-bg to-surface text-white/20"
          aria-hidden="true"
        >
          {/* TODO: replace with the real exploded-view video (autoplay on viewport entry) */}
          <CarSilhouette />
        </div>
        <p className="mt-3 text-small text-white/50">{t.mobileHint}</p>
        <ul className="mt-4 space-y-2">
          {hotspots.map((hotspot) => (
            <MobileHotspot key={hotspot.title} title={hotspot.title} text={hotspot.text} />
          ))}
        </ul>
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-h3 font-bold text-white">{t.finalLine}</p>
          <Button variant="primary" onClick={openOffer}>
            {t.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Hotspot({
  title,
  text,
  position,
  visible,
}: {
  title: string;
  text: string;
  position: { top: string; left: string };
  visible: boolean;
}) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-standard ease-expo ${
        visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        aria-describedby={tooltipId}
        aria-expanded={open}
        tabIndex={visible ? 0 : -1}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-11 items-center justify-center rounded-pill border-2 border-accent bg-bg/90 text-white shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={`absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-md bg-white p-3 text-left shadow-card transition-opacity duration-micro ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <p className="font-display text-small font-bold text-ink">{title}</p>
        <p className="mt-1 text-caption text-ink/70">{text}</p>
      </div>
    </div>
  );
}

function MobileHotspot({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li className="rounded-md border border-white/10 bg-white/5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-display font-semibold text-white">{title}</span>
        <span aria-hidden="true" className={`text-accent transition-transform ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <div id={panelId} hidden={!open} className="px-4 pb-3 text-small text-white/70">
        {text}
      </div>
    </li>
  );
}

function CarSilhouette() {
  return (
    <svg width="220" height="90" viewBox="0 0 220 90" fill="none" aria-hidden="true">
      <path
        d="M10 60l14-30a12 12 0 0 1 11-7h110a12 12 0 0 1 11 7l14 30v20a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6v-4H28v4a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V60Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="46" cy="80" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="174" cy="80" r="9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
