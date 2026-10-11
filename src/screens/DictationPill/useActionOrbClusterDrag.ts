import { useEffect, useRef, useState } from "react";
import type { View } from "react-native";

/** A move this far past the press point turns a press into a drag. */
const DRAG_THRESHOLD_PX = 4;

export type ClusterOffset = { x: number; y: number };

/**
 * A press that lands on a control is that control's, not the cluster's. React
 * Native Web renders `testID` as `data-testid`, which is how every button,
 * link and disclosure in the panel is already marked.
 */
function isControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('[data-testid="no-drag"]') !== null;
}

/**
 * Lets the parked orbs be dragged anywhere on screen.
 *
 * The overlay covers the whole work area, so there is no window to move — the
 * cluster is repositioned inside it instead. The main process is told when a
 * drag starts only so it holds the overlay interactive: the pointer crosses
 * transparent air on the way, and click-through would otherwise hand those
 * moves to the app underneath and strand the gesture half-finished.
 */
export function useActionOrbClusterDrag(): {
  /** The surface a drag may start from — the orbs, not the panel. */
  dragRef: React.RefObject<View | null>;
  offset: ClusterOffset;
} {
  const dragRef = useRef<View>(null);
  const [offset, setOffset] = useState<ClusterOffset>({ x: 0, y: 0 });

  useEffect(() => {
    // RN Web forwards the View ref to its DOM element.
    const node = dragRef.current as unknown as HTMLElement | null;
    if (!node) return;

    interface ClusterGesture {
      start: { x: number; y: number } | null;
      base: ClusterOffset;
      dragging: boolean;
      pointerId: number | null;
    }

    const gesture: ClusterGesture = {
      start: null,
      base: { x: 0, y: 0 },
      dragging: false,
      pointerId: null,
    };

    const endDrag = () => {
      if (gesture.dragging) window.electron?.dictation.endActionOrbDrag?.();
      gesture.dragging = false;
      gesture.start = null;
      gesture.pointerId = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (isControl(event.target)) return;
      gesture.pointerId = event.pointerId;
      gesture.start = { x: event.screenX, y: event.screenY };
      setOffset((current) => {
        gesture.base = current;
        return current;
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (
        !gesture.start ||
        gesture.pointerId === null ||
        event.pointerId !== gesture.pointerId
      ) {
        return;
      }

      const dx = event.screenX - gesture.start.x;
      const dy = event.screenY - gesture.start.y;

      if (
        !gesture.dragging &&
        Math.abs(dx) < DRAG_THRESHOLD_PX &&
        Math.abs(dy) < DRAG_THRESHOLD_PX
      ) {
        return;
      }
      if (!gesture.dragging) {
        gesture.dragging = true;
        node.setPointerCapture(gesture.pointerId);
        window.electron?.dictation.startActionOrbDrag?.();
      }
      setOffset({ x: gesture.base.x + dx, y: gesture.base.y + dy });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (gesture.pointerId === null || event.pointerId !== gesture.pointerId) {
        return;
      }

      if (node.hasPointerCapture(gesture.pointerId)) {
        node.releasePointerCapture(gesture.pointerId);
      }

      endDrag();
    };

    const onLostPointerCapture = (event: PointerEvent) => {
      if (gesture.pointerId === null || event.pointerId !== gesture.pointerId) {
        return;
      }

      endDrag();
    };

    node.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("blur", endDrag);
    node.addEventListener("lostpointercapture", onLostPointerCapture);

    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", endDrag);
      node.removeEventListener("lostpointercapture", onLostPointerCapture);
      if (gesture.dragging) window.electron?.dictation.endActionOrbDrag?.();
    };
  }, []);

  return { dragRef, offset };
}
