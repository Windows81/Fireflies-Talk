import { useEffect, useEffectEvent } from "react";

/**
 * Calls back on Escape while `active`. Listens on the window rather than a
 * focused element so it works for popovers that never take focus. Web and
 * desktop only.
 */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  const handleEscape = useEffectEvent(onEscape);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleEscape();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
