import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export interface HoverProps {
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

// Collapse is deferred so the brief out -> in that fires when the pointer
// crosses into a nested control resolves to "still hovered" before it lands.
const LEAVE_DELAY = 80;

/**
 * Reference-counted hover so the bar stays expanded while the pointer is over
 * any of its controls. The container and each interactive child share these
 * handlers; entering a child can fire the container's hover-out, so a single
 * boolean would drop focus on the buttons. Counting every source keeps it
 * stable regardless of which element currently owns the pointer.
 */
export const useStickyHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const countRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onHoverIn = useCallback(() => {
    countRef.current += 1;
    clearTimer();
    setIsHovered(true);
  }, [clearTimer]);

  const onHoverOut = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current > 0) return;
    clearTimer();
    timer.current = setTimeout(() => setIsHovered(false), LEAVE_DELAY);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const hoverProps: HoverProps =
    Platform.OS === "web" ? { onHoverIn, onHoverOut } : {};

  return { isHovered, hoverProps };
};
