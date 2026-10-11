import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";

interface CompactCardResizeHandleProps {
  /** Capture the starting size when the drag begins. */
  onResizeStart: () => void;
  /** Cumulative pointer delta from the start of the drag. */
  onResize: (dx: number, dy: number) => void;
  /** Commit the dragged size when the drag ends. */
  onResizeEnd: () => void;
}

/**
 * Bottom-right corner grip that lets the user resize a compact live panel card.
 * Marked testID="no-drag" so the gesture resizes the card instead of moving the
 * frameless window (the surrounding DragHandlerOverlay claims the bottom strip
 * for window dragging). Sits above that overlay via zIndex.
 */
export const CompactCardResizeHandle: FC<CompactCardResizeHandleProps> = ({
  onResizeStart,
  onResize,
  onResizeEnd,
}) => {
  const theme = useTheme();

  const pan = Gesture.Pan()
    // onStart (not onBegin) so a tap or sub-threshold move doesn't flip into
    // resizing — that would flash the window to max width and back.
    .onStart(() => {
      runOnJS(onResizeStart)();
    })
    .onUpdate((event) => {
      runOnJS(onResize)(event.translationX, event.translationY);
    })
    .onFinalize(() => {
      runOnJS(onResizeEnd)();
    });

  return (
    <GestureDetector gesture={pan}>
      <View testID="no-drag" style={styles.hitArea}>
        <View style={[styles.line(theme), styles.lineOuter]} />
        <View style={[styles.line(theme), styles.lineInner]} />
      </View>
    </GestureDetector>
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
});
