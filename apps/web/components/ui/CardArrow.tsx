/**
 * The arrow at the end of a car card (Figma 429:266 / 439:2672): Iconly "Arrow - Up" turned 45° — a 24px
 * glyph in a 34px box, no filled circle. One component for the deal card and the promo card so they match.
 * Place it inside a `group` link: it nudges and turns gold when the card is hovered.
 */
export function CardArrow() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[34px] shrink-0 items-center justify-center text-white transition-[color,transform] duration-standard ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 17 17 7M17 7H8.5M17 7v8.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
