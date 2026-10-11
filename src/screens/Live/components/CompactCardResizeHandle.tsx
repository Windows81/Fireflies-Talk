import { useEffect, useRef, type FC } from "react";
import { View } from "react-native";
import { createStyles, useTheme } from "@/styles";

/**
 * A press has to travel this far before it counts as a resize. Without it a
 * plain click starts one, and the window reserves its maximum width for as
 * long as the button is held — the panel visibly flashes wide and back.
 */
const RESIZE_THRESHOLD_PX = 4;

interface CompactCardResizeHandleProps {
  /** Capture the starting size when the drag begins. */
  onResizeStart: () => void;
  /** Cumulative pointer delta from the start of the drag. */
  onResize: (dx: number, dy: number) => void;
  /** Commit the dragged size when the drag ends. */
  onResizeEnd: () => void;
  /**
   * The card grows upward, so the grip belongs on its top edge and dragging up
   * has to make it taller. True on a bottom dock, where the window keeps its
   * foot planted and extends towards the top of the screen.
   */
  fromTop?: boolean;
}

/**
 * Corner grip that lets the user resize a compact live panel card. Marked
 * testID="no-drag" so the gesture resizes the card instead of moving the
 * frameless window (the surrounding DragHandlerOverlay claims the edge strip
 * for window dragging). Sits above that overlay via zIndex.
 *
 * The delta is measured in screen coordinates rather than through a gesture
 * recogniser. Resizing this card resizes the window around it, so anything
 * measured inside the window shifts under its own effect and the next frame
 * reads a corrupted delta — which showed up as the bar jittering up and down
 * while the card was dragged. Screen coordinates are unaffected by the window
 * moving, which is the same reason the pill's own drag uses them.
 */
export const CompactCardResizeHandle: FC<CompactCardResizeHandleProps> = ({
  onResizeStart,
  onResize,
  onResizeEnd,
  fromTop,
}) => {
  const theme = useTheme();
  const ref = useRef<View>(null);
  // Kept in a ref so the listeners below never need re-binding mid-drag.
  const latest = useRef({ onResizeStart, onResize, onResizeEnd, fromTop });
  latest.current = { onResizeStart, onResize, onResizeEnd, fromTop };

  useEffect(() => {
    // RN Web forwards the View ref to its DOM element.
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;

    let start: { x: number; y: number } | null = null;
    let resizing = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // Keep the window's own drag region out of it.
      event.preventDefault();
      event.stopPropagation();
      start = { x: event.screenX, y: event.screenY };
      resizing = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!start) return;
      const dx = event.screenX - start.x;
      const dy = event.screenY - start.y;
      if (!resizing) {
        if (
          Math.abs(dx) < RESIZE_THRESHOLD_PX &&
          Math.abs(dy) < RESIZE_THRESHOLD_PX
        ) {
          return;
        }
        resizing = true;
        latest.current.onResizeStart();
      }
      latest.current.onResize(dx, latest.current.fromTop ? -dy : dy);
    };
    const onPointerUp = () => {
      start = null;
      if (!resizing) return;
      resizing = false;
      latest.current.onResizeEnd();
    };

    node.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    // A cancelled gesture never sends pointerup and would leave the card stuck
    // in its dragging size.
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("blur", onPointerUp);
    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", onPointerUp);
      if (resizing) latest.current.onResizeEnd();
    };
  }, []);

  return (
    <View
      ref={ref}
      testID="no-drag"
      style={[styles.hitArea, fromTop && styles.hitAreaTop]}
    >
      <View
        style={[
          styles.line(theme),
          fromTop ? styles.lineOuterTop : styles.lineOuter,
        ]}
      />
      <View
        style={[
          styles.line(theme),
          fromTop ? styles.lineInnerTop : styles.lineInner,
        ]}
      />
    </View>
  );
};

const styles = createStyles({
  hitArea: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 18,
    height: 18,
    zIndex: 10,
    // Diagonal resize cursor (web only); RN's CursorValue type omits it.
    cursor: "nwse-resize" as any,
  },
  // Bottom dock: the card grows upward, so the grip sits on the edge that moves.
  hitAreaTop: {
    bottom: undefined,
    top: 2,
    cursor: "nesw-resize" as any,
  },
  line: (theme) => ({
    position: "absolute",
    height: 1.5,
    borderRadius: 1,
    backgroundColor: theme.colors.textSecondary,
    transform: [{ rotate: "-45deg" }],
  }),
  // Two diagonal strokes forming a corner grip.
  lineOuter: {
    width: 12,
    right: 1,
    bottom: 4,
  },
  lineInner: {
    width: 7,
    right: 3,
    bottom: 0,
  },
  // Mirrored for the top-right corner, so the strokes follow that corner.
  lineOuterTop: {
    width: 12,
    right: 1,
    top: 4,
    transform: [{ rotate: "45deg" }],
  },
  lineInnerTop: {
    width: 7,
    right: 3,
    top: 0,
    transform: [{ rotate: "45deg" }],
  },
});
