import { View } from "react-native";
import { createStyles } from "@/styles";
import type { FC } from "react";

/**
 * DragHandlerOverlay - A transparent overlay that enables window dragging
 *
 * This component is positioned absolutely behind interactive elements (buttons, inputs)
 * but above the panel background. It allows users to drag the window from anywhere
 * on the panel while keeping all interactive elements clickable.
 *
 * The overlay has testID="drag" which applies -webkit-app-region: drag via CSS,
 * while buttons automatically have -webkit-app-region: no-drag, ensuring they
 * remain clickable and appear "on top" of the drag region.
 */
export const DragHandlerOverlay: FC = () => {
  return (
    <>
      <View testID="drag" style={styles.top} />
      <View testID="drag" style={styles.bottom} />
    </>
  );
};

const styles = createStyles({
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 0,
    pointerEvents: "auto",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 0,
    pointerEvents: "auto",
  },
});
