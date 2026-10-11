import type { Theme } from "@/styles";
import { useTheme } from "@/styles";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Circle, Svg } from "react-native-svg";

interface CircularProgressProps {
  size: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  stage?: "default" | "good" | "warning" | "critical";
  /**
   * Value between 0 and 100
   */
  value: number;
}

const COLOR_MAP: Record<
  NonNullable<CircularProgressProps["stage"]>,
  {
    background: keyof Theme["colors"];
    foreground: keyof Theme["colors"];
  }
> = {
  default: {
    background: "layerBrandLight2",
    foreground: "layerBrand",
  },
  good: {
    background: "informationStaticGreenSubtle",
    foreground: "informationStaticGreenSolid",
  },
  warning: {
    background: "informationStaticYellowSubtle",
    foreground: "informationStaticYellowSolid",
  },
  critical: {
    background: "informationStaticRedSubtle",
    foreground: "informationStaticRedSolid",
  },
};

export const CircularProgress: FC<CircularProgressProps> = ({
  size,
  strokeWidth = 12,
  style,
  value,
  stage = "default",
  ...props
}) => {
  const viewBoxSize = 100;
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - value / 100);

  const theme = useTheme();

  const COLOR = COLOR_MAP[stage];

  return (
    <Svg
      width={size}
      height={size}
      style={style}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      {...props}
    >
      <Circle
        cx={viewBoxSize / 2}
        cy={viewBoxSize / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={theme.colors[COLOR.background]}
      />
      <Circle
        cx={viewBoxSize / 2}
        cy={viewBoxSize / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={theme.colors[COLOR.foreground]}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
      />
    </Svg>
  );
};
