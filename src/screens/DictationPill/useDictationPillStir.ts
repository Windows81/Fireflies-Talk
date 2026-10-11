import type { DictationPillSide } from "electron/src/types";
import { isWindowsDesktop } from "@/utils/device";
import { useEffect } from "react";
import {
  type SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { emberNubCentre, resolveEmberStir } from "./dictationPillEmberGeometry";
import { isDictationPillVertical } from "./dictationPillMode";

export type DictationPillStir = {
  near: SharedValue<number>;
  lean: SharedValue<number>;
  /** The nub's centre in window coordinates, shared by the embers and their halo. */
  centre: { x: number; y: number };
};

const FOLLOW = { duration: 120 };
const SETTLE = { duration: 400 };

/**
 * Follows the cursor across the pill's host window and reduces it to how near
 * the nub it is and which way along the edge it sits, as shared values so the
 * embers can react every frame without a render.
 *
 * Electron only: the pill window forwards mouse moves to the page even while
 * clicks pass through it, so the cursor is seen well before it reaches the pill.
 */
export function useDictationPillStir(
  side: DictationPillSide,
): DictationPillStir {
  const near = useSharedValue(0);
  const lean = useSharedValue(0);
  const centre = emberNubCentre(side, isWindowsDesktop() ? "win32" : "darwin");
  const { x, y } = centre;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const vertical = isDictationPillVertical(side);

    const onMove = (event: MouseEvent) => {
      const stir = resolveEmberStir(
        { x: event.clientX, y: event.clientY },
        { x, y },
        vertical,
      );
      near.value = withTiming(stir.near, FOLLOW);
      lean.value = withTiming(stir.lean, FOLLOW);
    };
    const onLeave = () => {
      near.value = withTiming(0, SETTLE);
      lean.value = withTiming(0, SETTLE);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [side, x, y, near, lean]);

  return { near, lean, centre };
}
