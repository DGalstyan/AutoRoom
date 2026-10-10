'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface FieldSelectOption {
  value: string;
  label: string;
}

/**
 * The 72px pill dropdown the dealer booking form uses (Figma "Input Text" with a
 * trailing chevron, and the "Dropdown menu" list it opens — 36px rows on white,
 * 12px corners, soft shadow). A listbox rather than a native `<select>` so the
 * open state matches the design; it keeps the native behaviours people expect —
 * outside click and Escape close it, arrow keys move, Enter/Space choose.
 */
export function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  describedBy,
}: {
  id: string;
  /** Accessible name (the visible label sits outside, in the form). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldSelectOption[];
  placeholder?: string;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector<HTMLElement>('button[aria-haspopup]')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
    <div ref={root} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        aria-describedby={describedBy}
        onClick={() => setOpen((o) => !o)}
        className="type-body flex h-[72px] w-full items-center justify-between gap-3 rounded-[50px] bg-neutral-25 px-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className={`truncate ${selected ? 'text-neutral-800' : 'text-neutral-600'}`}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-micro ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2.53 4.26 6 7.74l3.47-3.48"
            stroke="#3D3D3D"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[252px] overflow-y-auto rounded-[12px] bg-white px-3 py-1 shadow-[0_1px_12px_rgba(19,15,38,0.08)] [scrollbar-color:#e5e7e8_transparent] [scrollbar-width:thin]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                autoFocus={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center border-b border-neutral-50 px-2 text-left text-[14px] leading-4 transition-colors duration-micro last:border-b-0 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  isSelected ? 'font-medium text-neutral-800' : 'text-neutral-600'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
