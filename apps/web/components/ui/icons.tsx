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

/** Figma's phone-receiver glyph (node `291:704`, the "Dealers" hero's
 * `Խոսել մեր մասնագետի հետ` button — a click-to-call CTA that was missing
 * its icon entirely). Kept separate from `ContactInfo`'s own local phone
 * icon, which renders a different node (`141:829`, the Contact page) and
 * shouldn't be re-pointed at a shape it wasn't audited against. */
export function PhoneIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8.65667 9.34484C11.5667 12.2548 12.2342 8.88734 14.0867 10.7398C15.8717 12.5248 16.8992 12.8848 14.6342 15.1498C14.3492 15.3748 12.5492 18.1198 6.21167 11.7898C-0.12583 5.45234 2.61917 3.65234 2.84417 3.36734C5.11667 1.09484 5.46917 2.12984 7.25417 3.91484C9.11417 5.76734 5.74667 6.43484 8.65667 9.34484Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
