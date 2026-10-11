import { useEffect, useRef } from "react";
import type { View } from "react-native";

export function useIntersectionLoadMore(
  onLoadMore: () => void,
  enabled: boolean,
) {
  const sentinelRef = useRef<View>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;

    const element = sentinelRef.current as unknown as Element | null;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  return sentinelRef;
}
