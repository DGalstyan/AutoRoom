/**
 * Small shared icon set — plain inline SVGs, not a full icon library, since
 * the site only needs a handful of these. `aria-hidden` on every icon: each
 * one only ever sits inside a button/link that already carries its own
 * accessible label as text.
 */

/** Figma's "Iconly/Light-outline/Arrow - Up" (diagonal, up-right) — the CTA
 * arrow used on every pill/link button across the site (branch directions,
 * the contact form's submit button, etc). */
export function ArrowUpRightIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4 12 12 4M12 4H6M12 4v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
