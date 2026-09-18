import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store with React subscription.
 * Server snapshot always returns the default so SSR/hydration match;
 * the real value lands on the first client render after hydration.
 */
export function createLocalStore<T>(key: string, defaultValue: T) {
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  let loaded = false;

  const isBrowser = () => typeof window !== "undefined";

  const read = (): T => {
    if (!isBrowser()) return defaultValue;
    if (!loaded) {
      try {
        const raw = window.localStorage.getItem(key);
        cache = raw ? (JSON.parse(raw) as T) : defaultValue;
      } catch {
        cache = defaultValue;
      }
      loaded = true;
    }
    return cache as T;
  };

  const write = (next: T) => {
    cache = next;
    loaded = true;
    if (isBrowser()) {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* quota or private mode — keep in-memory */
      }
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        loaded = false;
        l();
      }
    };
    if (isBrowser()) window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      if (isBrowser()) window.removeEventListener("storage", onStorage);
    };
  };

  const use = () => useSyncExternalStore(subscribe, read, () => defaultValue);

  return {
    get: read,
    set: write,
    update: (fn: (prev: T) => T) => write(fn(read())),
    use,
  };
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
