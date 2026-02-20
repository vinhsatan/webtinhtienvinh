// Minimal test setup for Vitest
// Polyfills and small mocks used by unit tests.

// Ensure a `window` global exists for code that expects a browser-like env
if (typeof (globalThis as any).window === 'undefined') {
  // @ts-ignore
  (globalThis as any).window = globalThis;
}

// matchMedia polyfill for components that call it
if (typeof (globalThis as any).window.matchMedia !== 'function') {
  // @ts-ignore
  (globalThis as any).window.matchMedia = (query: string) => ({
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

// Provide a minimal global __TEST__ flag that tests can use
;(globalThis as any).__TEST__ = true;

// No-op for DOM APIs that may be used in tests but are not present in Node
if (typeof (globalThis as any).window.HTMLElement === 'undefined') {
  // @ts-ignore
  (globalThis as any).window.HTMLElement = function HTMLElement() {} as any;
}

// Ensure test DB env so modules that validate DB_CONN don't throw during tests.
process.env.DB_CONN = process.env.DB_CONN || 'postgres://test:test@localhost:5432/test';

export {};
