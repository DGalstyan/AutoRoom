import { messages } from '@/lib/messages';

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-bg text-white/50"
    >
      <span className="sr-only">{messages.common.loading}</span>
      <span
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-pill border-2 border-white/20 border-t-accent motion-reduce:animate-none"
      />
    </div>
  );
}
