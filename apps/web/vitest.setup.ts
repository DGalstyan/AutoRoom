import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// `LocaleProvider` (rendered by `lib/test-utils.tsx`'s `renderWithLocale`,
// itself needed by any component reading `useMessages()`/`useLocale()`)
// calls `useRouter()` to `router.refresh()` after a language switch. Plain
// RTL/jsdom renders have no App Router context mounted, so without this
// stub every such render throws "invariant expected app router to be
// mounted" — even in tests that never touch the language switcher.
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      refresh: vi.fn(),
    }),
  };
});

// jsdom doesn't implement `matchMedia` — `Header`'s drawer-close-on-resize
// effect (and anything else reaching for a media query) needs this stub or
// every render throws `window.matchMedia is not a function`.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
