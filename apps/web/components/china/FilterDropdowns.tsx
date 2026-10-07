'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';

const ICONS = '/images/china/filters';
const SHADOW = 'shadow-[0_1px_12px_rgba(19,15,38,0.04)]';

/** Closes on outside pointer-down and Escape (returning focus to the trigger). */
function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) close();
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        root.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, root]);
}

/** The 200×36 pill every filter opens from (Figma "Prompt"). */
function Trigger({
  label,
  open,
  controls,
  onClick,
}: {
  label: string;
  open: boolean;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      className="flex h-9 w-full items-center justify-between rounded-pill bg-neutral-25 py-1 pl-3 pr-2 text-left text-[12px] font-medium leading-[18px] text-neutral-800 transition-colors duration-micro hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-[200px]"
    >
      <span className="truncate">{label}</span>
      <Image
        src={`${ICONS}/chevron.svg`}
        alt=""
        width={12}
        height={12}
        className={`shrink-0 transition-transform duration-micro ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

function Pointer({ className, kind }: { className: string; kind: 'list' | 'price' }) {
  return (
    <Image
      src={`${ICONS}/arrow-${kind}.svg`}
      alt=""
      width={20}
      height={18}
      aria-hidden="true"
      className={`absolute top-[-9px] ${className}`}
    />
  );
}

/**
 * Single-choice list filter — Figma "Dropdown menu" 438:1429: a 206px white card
 * with a pointer, a ticked first row ("all") and grey rows separated by hairlines,
 * scrolling inside a 260px box with a slim track.
 */
export function ListDropdown({
  label,
  allLabel,
  allRowLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  /** Row that clears the filter, and the trigger text while nothing is chosen. */
  allLabel: string;
  /** Text of the first row ("All"). */
  allRowLabel: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  useDismiss(open, () => setOpen(false), root);

  const rows = [{ value: '', label: allRowLabel }, ...options.map((o) => ({ value: o, label: o }))];

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'),
    );
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? at + 1 : at - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  return (
    <div ref={root} className="relative w-full sm:w-auto" aria-label={label}>
      <Trigger
        label={value || allLabel}
        open={open}
        controls={listId}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={`absolute left-1/2 top-[calc(100%+12px)] z-20 w-[min(206px,calc(100vw-32px))] -translate-x-1/2 rounded-[12px] bg-white py-1 pl-3 pr-2 ${SHADOW}`}
        >
          <Pointer className="left-[calc(50%-10px)]" kind="list" />
          <div className="max-h-[252px] overflow-y-auto pr-1 [scrollbar-color:#e5e7e8_transparent] [scrollbar-width:thin]">
            {rows.map((row, index) => {
              const selected = row.value === value;
              return (
                <button
                  key={row.value || '__all'}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  autoFocus={selected}
                  onClick={() => choose(row.value)}
                  className={`flex min-h-11 w-full items-center gap-2 border-b border-neutral-50 py-2.5 pl-2 pr-8 text-left text-[12px] leading-4 transition-colors duration-micro hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                    selected ? 'font-medium text-neutral-800' : 'font-normal text-neutral-600'
                  } ${index === 0 ? 'rounded-t-[8px]' : ''}`}
                >
                  {index === 0 && (
                    <span
                      aria-hidden="true"
                      className={`relative flex size-3 shrink-0 items-center justify-center rounded-[4px] border ${
                        selected ? 'border-neutral-700 bg-neutral-700' : 'border-neutral-600'
                      }`}
                    >
                      {selected && (
                        <Image src={`${ICONS}/done.svg`} alt="" width={10} height={10} />
                      )}
                    </span>
                  )}
                  <span className="truncate">{row.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const fmt = (n: number) => `${n.toLocaleString('en-US')}$`;

const THUMB =
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[30px] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[url(/images/china/filters/knob.svg)] [&::-webkit-slider-thumb]:bg-contain [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-[30px] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[url(/images/china/filters/knob.svg)] [&::-moz-range-thumb]:bg-contain';

/**
 * Price filter — Figma "Dropdown menu" 438:1507/1475: a 458px card with two
 * pill inputs, then a track with two gold ring knobs. While the range is the
 * full one the bounds sit at the track ends; once changed, each value rides
 * above its knob. Committed (URL updated) when a drag or an edit ends.
 */
export function PriceDropdown({
  label,
  fromLabel,
  toLabel,
  min,
  max,
  low,
  high,
  onChange,
  onCommit,
}: {
  label: string;
  fromLabel: string;
  toLabel: string;
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  onCommit: (low: number, high: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useDismiss(open, () => setOpen(false), root);

  const changed = low > min || high < max;
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  const triggerLabel = changed ? `${fmt(low)} – ${fmt(high)}` : label;

  return (
    <div ref={root} className="relative w-full sm:w-auto">
      <Trigger
        label={triggerLabel}
        open={open}
        controls={panelId}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className={`absolute right-0 top-[calc(100%+12px)] z-20 w-[min(458px,calc(100vw-32px))] rounded-[12px] bg-white p-6 ${SHADOW}`}
        >
          <Pointer className="right-[90px] max-sm:hidden" kind="price" />

          <div className="flex items-center gap-2.5">
            <PriceInput
              label={fromLabel}
              value={low}
              onValue={(v) => onChange(Math.min(Math.max(v, min), high), high)}
              onDone={() => onCommit(low, high)}
            />
            <PriceInput
              label={toLabel}
              value={high}
              onValue={(v) => onChange(low, Math.max(Math.min(v, max), low))}
              onDone={() => onCommit(low, high)}
            />
          </div>

          <div className="relative mt-[18px] h-[18px] text-[12px] font-medium leading-[18px] text-neutral-800">
            {changed ? (
              <>
                <span
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `calc(15px + (100% - 30px) * ${pct(low) / 100})` }}
                >
                  {fmt(low)}
                </span>
                <span
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `calc(15px + (100% - 30px) * ${pct(high) / 100})` }}
                >
                  {fmt(high)}
                </span>
              </>
            ) : (
              <span className="flex justify-between">
                <span>{fmt(min)}</span>
                <span>{fmt(max)}</span>
              </span>
            )}
          </div>

          <div className="relative mt-2 h-[30px]">
            <div className="absolute inset-x-0 top-[10px] h-[9px] rounded-[44px] bg-neutral-25" />
            <input
              type="range"
              aria-label={fromLabel}
              min={min}
              max={max}
              step={1000}
              value={low}
              onChange={(event) => onChange(Math.min(Number(event.target.value), high), high)}
              onPointerUp={() => onCommit(low, high)}
              onKeyUp={() => onCommit(low, high)}
              className={`pointer-events-none absolute inset-0 h-[30px] w-full appearance-none bg-transparent ${THUMB}`}
            />
            <input
              type="range"
              aria-label={toLabel}
              min={min}
              max={max}
              step={1000}
              value={high}
              onChange={(event) => onChange(low, Math.max(Number(event.target.value), low))}
              onPointerUp={() => onCommit(low, high)}
              onKeyUp={() => onCommit(low, high)}
              className={`pointer-events-none absolute inset-0 h-[30px] w-full appearance-none bg-transparent ${THUMB}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PriceInput({
  label,
  value,
  onValue,
  onDone,
}: {
  label: string;
  value: number;
  onValue: (value: number) => void;
  onDone: () => void;
}): ReactNode {
  return (
    <label className="flex h-9 min-w-0 flex-1 items-center rounded-pill bg-neutral-25 pl-3 pr-2 text-[12px] font-medium leading-[18px] text-neutral-800">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(event) => onValue(Number(event.target.value) || 0)}
        onBlur={onDone}
        onKeyDown={(event) => event.key === 'Enter' && onDone()}
        placeholder={label}
        className="min-w-0 flex-1 bg-transparent tabular-nums outline-none"
      />
      <span aria-hidden="true">$</span>
    </label>
  );
}
