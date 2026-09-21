import { deleteCookie, getCookie, setCookie } from "cookies-next/client";

export const TOKEN_COOKIE = "token";

// Tiny external store so React can subscribe to the auth cookie with
// useSyncExternalStore (no effect-driven state juggling, no hydration mismatch).
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeToken = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getTokenSnapshot = (): string | null => (getCookie(TOKEN_COOKIE) as string) ?? null;

/** The server never sees the cookie here, so it always renders signed out. */
export const getServerTokenSnapshot = (): string | null => null;

export const storeToken = (token: string) => {
  setCookie(TOKEN_COOKIE, token, { maxAge: 60 * 60 * 24, path: "/", sameSite: "lax" });
  emit();
};

export const clearToken = () => {
  deleteCookie(TOKEN_COOKIE, { path: "/" });
  emit();
};
