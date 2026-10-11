import { useEffect, useReducer } from "react";
import {
  INITIAL_PASTE_FALLBACK_TOAST,
  PASTE_FALLBACK_TOAST_MS,
  reducePasteFallbackToast,
} from "./dictationPasteFallbackToast";

/**
 * Whether the "Ready to paste" toast is up. The main process raises it
 * when a paste keystroke went out but nothing focused could take the text.
 */
export function usePasteFallbackToast(): boolean {
  const [toast, dispatch] = useReducer(
    reducePasteFallbackToast,
    INITIAL_PASTE_FALLBACK_TOAST,
  );

  useEffect(
    () =>
      window.electron?.dictation.onPasteFallbackToast?.(() =>
        dispatch({ type: "show" }),
      ),
    [],
  );

  useEffect(() => {
    if (!toast.visible) return;
    const { generation } = toast;
    const timer = setTimeout(
      () => dispatch({ type: "hide", generation }),
      PASTE_FALLBACK_TOAST_MS,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  return toast.visible;
}
