import '@testing-library/jest-dom/vitest';

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
