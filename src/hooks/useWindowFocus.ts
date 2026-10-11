import { useEffect, useEffectEvent, useRef } from "react";

/**
 * Subscribes to Electron's window focus event and calls the callback.
 * No-op on platforms where window.electron is unavailable.
 *
 * @param throttleMs - Minimum milliseconds between calls. Omit for no throttle.
 */
export function useWindowFocus(
  callback: () => void,
  options?: { throttleMs?: number },
): void {
  const onFocus = useEffectEvent(callback);

  const lastCallRef = useRef<number>(0);
  const throttleMs = options?.throttleMs;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const electron = window.electron;
    if (!electron?.onWindowFocus) return;

    return electron.onWindowFocus(() => {
      if (throttleMs !== undefined) {
        const now = Date.now();
        if (now - lastCallRef.current < throttleMs) return;
        lastCallRef.current = now;
      }
      onFocus();
    });
  }, [throttleMs]);
}
