'use client';

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Selectable pill used across `UniversalPopup` / `QuizPopup` chip questions. */
export function Chip({ selected, onClick, children, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-pill border px-4 py-2 text-sm font-medium transition-colors duration-micro ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        selected
          ? 'border-accent bg-accent text-white'
          : 'border-line-light bg-white text-ink hover:border-accent/60'
      } ${className}`}
    >
      {children}
    </button>
  );
}
