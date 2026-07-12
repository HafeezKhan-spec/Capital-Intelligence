import { useEffect, useState, useCallback } from "react";

const WATCHLIST_KEY = "ci_watchlist_v1";

export function useWatchlist() {
  const [items, setItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      if (raw) setItems(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* noop */
    }
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setItems(new Set(next));
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(Array.from(next)));
    } catch {
      /* noop */
    }
  }, []);

  const toggle = useCallback(
    (code: string) => {
      const next = new Set(items);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      persist(next);
    },
    [items, persist],
  );

  const has = useCallback((code: string) => items.has(code), [items]);

  return { items, toggle, has };
}
