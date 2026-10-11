import { type RefObject, useEffect, useState } from "react";
import type { View } from "react-native";

/**
 * Tracks whether the pointer is within an element's bounds using a document
 * mousemove listener compared against the element's rect. Unlike enter/leave
 * based hover (e.g. useWebHover), it does not flicker when the cursor moves
 * over interactive children, since hover is derived purely from coordinates.
 *
 * @param padding extra px around the element that still counts as "within".
 */
export const useHoverWithin = (
  ref: RefObject<View | null>,
  padding = 0,
): boolean => {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleMove = (event: MouseEvent) => {
      const node = ref.current as unknown as HTMLElement | null;
      if (!node?.getBoundingClientRect) return;
      const rect = node.getBoundingClientRect();
      setHovered(
        event.clientX >= rect.left - padding &&
          event.clientX <= rect.right + padding &&
          event.clientY >= rect.top - padding &&
          event.clientY <= rect.bottom + padding,
      );
    };

    document.addEventListener("mousemove", handleMove);
    const cleanupBlur = window.electron?.onWindowBlur?.(() =>
      setHovered(false),
    );
    return () => {
      document.removeEventListener("mousemove", handleMove);
      cleanupBlur?.();
    };
  }, [ref, padding]);

  return hovered;
};
