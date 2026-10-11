import { useCallback, useEffect, useState } from "react";

const GRANT_POLL_MS = 800;

export type DictationAccessibilityPhase = "needed" | "success";

export function useDictationAccessibilityPrompt(options?: {
  standalone?: boolean;
}) {
  const standalone = Boolean(options?.standalone);
  const [visible, setVisible] = useState(standalone);
  const [phase, setPhase] = useState<DictationAccessibilityPhase>("needed");

  const hide = useCallback(() => {
    setVisible(false);
    if (standalone) {
      window.electron?.dictation?.closeAccessibilityPrompt();
      return;
    }
    setPhase("needed");
  }, [standalone]);

  useEffect(() => {
    if (!visible || phase !== "needed") return;

    const check = () => {
      void window.electron?.dictation
        ?.hasAccessibilityPermission()
        .then((granted) => {
          if (granted) setPhase("success");
        });
    };

    check();
    const timer = setInterval(check, GRANT_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [phase, visible]);

  return {
    visible,
    phase,
    dismiss: hide,
    openSettings: () => {
      void window.electron?.dictation?.openAccessibilitySettings();
    },
  };
}
