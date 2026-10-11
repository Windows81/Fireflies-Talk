import { useEffect, useState, type RefObject } from "react";
import type { View } from "react-native";

const HOVER_PADDING = 16;

// Idle delay before the bar collapses back to the pill once the cursor leaves.
const COLLAPSE_DELAY = 20000;

/**
 * Owns the live bar's collapsed (pill) state.
 *
 * @param ref - Bar container to hit-test the cursor against.
 * @param anyWindowOpen - While true, the bar stays expanded and never collapses.
 * @returns The collapsed (pill) state, plus raw hover for chrome that should
 * appear only under the cursor regardless of open panels.
 */
export const useLiveBarHover = (
  ref: RefObject<View | null>,
  anyWindowOpen: boolean,
): { collapsed: boolean; isHovered: boolean } => {
  const [isHovered, setIsHovered] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleMouseMove = (e: MouseEvent) => {
      const node = ref.current as unknown as HTMLElement | null;
      if (!node?.getBoundingClientRect) return;

      const rect = node.getBoundingClientRect();
      setIsHovered(
        e.clientX >= rect.left - HOVER_PADDING &&
          e.clientX <= rect.right + HOVER_PADDING &&
          e.clientY >= rect.top - HOVER_PADDING &&
          e.clientY <= rect.bottom + HOVER_PADDING,
      );
    };
    document.addEventListener("mousemove", handleMouseMove);

    // mousemove stops arriving once the cursor leaves this window, so hover
    // would latch on forever without an explicit leave.
    const handleMouseLeave = () => setIsHovered(false);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Treat losing window focus as a mouse-leave.
    const cleanupBlur = window.electron?.onWindowBlur?.(() => {
      setIsHovered(false);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cleanupBlur?.();
    };
  }, [ref]);

  // Expanded while hovered or while a window is open; once both are false, arm
  // the idle timer and collapse to the pill when it elapses.
  useEffect(() => {
    // Temporarily disabled on Windows: the collapse/expand morph is wonky there,
    // so the bar stays permanently expanded and we only arm the timer on macOS.
    const isMac = window.electron?.platform === "darwin";
    if (!isMac) return;

    if (isHovered || anyWindowOpen) {
      setCollapsed(false);
      return;
    }
    const timer = window.setTimeout(() => setCollapsed(true), COLLAPSE_DELAY);
    return () => window.clearTimeout(timer);
  }, [isHovered, anyWindowOpen]);

  return { collapsed, isHovered };
};
