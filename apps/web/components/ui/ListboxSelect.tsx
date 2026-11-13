'use client';

import { useEffect, useId, useRef, useState } from 'react';

/** Figma "General tools" (495:14938) dropdown card: white, 12px corners, soft shadow, caret on top, hairline-divided 12px options. */
export const DROPDOWN_PANEL =
  'absolute left-0 right-0 top-full z-20 mt-3 rounded-[12px] bg-white px-3 py-1 shadow-[0_1px_12px_rgba(19,15,38,0.08)]';
export const DROPDOWN_OPTION =
  'flex w-full items-center border-b border-[#f5f5f6] py-2.5 pl-2 pr-8 text-left text-[12px] leading-4 text-[#999ea1] transition-colors last:border-b-0 hover:text-ink focus-visible:text-ink focus-visible:outline-none';

export function DropdownCaret() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="absolute -top-[9px] left-[93px] size-5 text-white"
    >
      <path d="M10 2 17 8H3Z" fill="currentColor" />
    </svg>
  );
}

export interface ListboxOption {
  value: string;
  label: string;
}

/**
 * A select that draws Figma's custom dropdown card instead of the browser's native list.
 * The trigger takes the same props `Field` hands a control (`id`, aria-*).
 */
export function ListboxSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  triggerClassName,
  ...aria
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  placeholder: string;
  triggerClassName: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setActive(
          Math.max(
            0,
            options.findIndex((o) => o.value === value),
          ),
        );
        setOpen(true);
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (index + step + options.length) % options.length);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      const option = options[active];
      if (option) choose(option.value);
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        {...aria}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setActive(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
          setOpen((current) => !current);
        }}
        className={`${triggerClassName} text-left ${selected ? 'text-ink' : 'text-neutral-600'}`}
      >
        <span className="block truncate">{selected?.label ?? placeholder}</span>
      </button>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute right-6 top-1/2 size-3 -translate-y-1/2 text-ink transition-transform ${open ? 'rotate-180' : ''}`}
      >
        <path
          d="M5 7.5 10 12.5 15 7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {open && (
        <div className={DROPDOWN_PANEL}>
          <DropdownCaret />
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto">
            {options.map((option, index) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => choose(option.value)}
                  onMouseEnter={() => setActive(index)}
                  className={`${DROPDOWN_OPTION} ${index === active || option.value === value ? '!text-ink' : ''}`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
