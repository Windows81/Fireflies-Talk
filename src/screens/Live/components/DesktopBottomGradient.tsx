import type { FC } from "react";
import { StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Mask,
  G,
} from "react-native-svg";

export const DesktopBottomGradient: FC<{ width?: number }> = ({
  width = 456,
}) => {
  return (
    <Svg width={width} height={42} viewBox="0 0 456 48" style={styles.root}>
      <Defs>
        {/* Your original horizontal color gradient */}
        <LinearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8FFFCE" />
          <Stop offset="0.313755" stopColor="#9FB5FF" />
          <Stop offset="0.660355" stopColor="#BF9AFF" />
          <Stop offset="1" stopColor="#FFD391" />
        </LinearGradient>

        {/* Vertical alpha mask: opaque at bottom -> transparent at top */}
        {/* In a mask, white = fully visible, black/transparent = hidden */}
        <LinearGradient id="fadeMaskGradient" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>

        <Mask id="fadeMask">
          {/* Match rect size to what you're masking */}
          <Rect
            x={-13}
            y={24}
            width={480}
            height={80}
            rx={4}
            fill="url(#fadeMaskGradient)"
          />
        </Mask>
      </Defs>

      {/* Apply the mask to the colored rect */}
      <G mask="url(#fadeMask)">
        <Rect
          x={-13}
          y={24}
          width={480}
          height={30}
          rx={4}
          fill="url(#colorGradient)"
        />
      </G>
    </Svg>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    bottom: 0,
    left: -2,
    right: -2,
    height: 48,
    marginBottom: -2,
  },
});
