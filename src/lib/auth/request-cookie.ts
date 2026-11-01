type CookieStore = { getStore: () => string | null | undefined };

const KEY = Symbol.for("ctw.requestCookie");

export function bindRequestCookieStore(store: CookieStore) {
  (globalThis as Record<symbol, CookieStore>)[KEY] = store;
}

export function requestCookieHeader(): string | null {
  const store = (globalThis as Record<symbol, CookieStore | undefined>)[KEY];
  const value = store?.getStore();
  return value ?? null;
}
