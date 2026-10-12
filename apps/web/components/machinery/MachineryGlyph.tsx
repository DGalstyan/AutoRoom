/** A simple excavator drawing in the site's line style; there is no machinery photography yet. Decorative. */
export function MachineryGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="20" y="118" width="130" height="26" rx="13" />
      <circle cx="40" cy="131" r="5" />
      <circle cx="130" cy="131" r="5" />
      <path d="M40 118V96h70v22" />
      <path d="M52 96V70h38l14 26" />
      <path d="M96 84 150 38l36 26" />
      <path d="m186 64-8 40" />
      <path d="M170 104h28l-6 22h-22z" />
    </svg>
  );
}
