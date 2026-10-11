import { useTheme } from "@/styles";
import type { FC } from "react";
import { Circle, Path, Svg } from "react-native-svg";

const SIZE = 16;
const RING_RADIUS = 7;
const WEDGE_RADIUS = 6;
const CENTER = SIZE / 2;

// Pie wedge from 12 o'clock, sweeping clockwise for the completed fraction.
const describeWedge = (fraction: number) => {
  const angle = fraction * 2 * Math.PI;
  const endX = CENTER + WEDGE_RADIUS * Math.sin(angle);
  const endY = CENTER - WEDGE_RADIUS * Math.cos(angle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - WEDGE_RADIUS} A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${largeArc} 1 ${endX} ${endY} Z`;
};

export const TaskProgressRing: FC<{ completed: number; total: number }> = ({
  completed,
  total,
}) => {
  const theme = useTheme();
  const fraction = total > 0 ? Math.min(1, completed / total) : 0;

  // Empty: dashed ring (#acaeb1). In progress: solid ring + filled wedge (#d3d4d7).
  if (fraction <= 0) {
    return (
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          stroke={theme.colors.textSecondary}
          strokeWidth={2}
          strokeDasharray="2 2"
          fill="none"
        />
      </Svg>
    );
  }

  const fill = theme.colors.textPrimary;

  return (
    <Svg width={SIZE} height={SIZE}>
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        stroke={fill}
        strokeWidth={1.5}
        fill="none"
      />
      {fraction >= 1 ? (
        <Circle cx={CENTER} cy={CENTER} r={WEDGE_RADIUS} fill={fill} />
      ) : (
        <Path d={describeWedge(fraction)} fill={fill} />
      )}
    </Svg>
  );
};
