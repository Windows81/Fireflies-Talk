import { storage } from "@/features/storage";
import { useCallback, useEffect, useState } from "react";

const read = (key: string): string[] => {
  try {
    const raw = storage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

/**
 * Persisted, de-duplicated most-recent-first list of string entries (search
 * terms, channel ids, …) capped at `max`. Comparison is case-insensitive.
 */
export const useRecentList = (storageKey: string, max: number) => {
  const [recent, setRecent] = useState<string[]>(() => read(storageKey));

  // Persist whenever the list settles, always from the latest state rather
  // than a snapshot captured by add/remove, so back-to-back calls can't
  // overwrite each other.
  useEffect(() => {
    storage.setItem(storageKey, JSON.stringify(recent));
  }, [storageKey, recent]);

  const add = useCallback(
    (term: string) => {
      const value = term.trim();
      if (!value) return;
      setRecent((current) => {
        const deduped = current.filter(
          (item) => item.toLowerCase() !== value.toLowerCase(),
        );
        return [value, ...deduped].slice(0, max);
      });
    },
    [max],
  );

  const remove = useCallback((term: string) => {
    const value = term.trim().toLowerCase();
    setRecent((current) =>
      current.filter((item) => item.toLowerCase() !== value),
    );
  }, []);

  return { recent, add, remove };
};
