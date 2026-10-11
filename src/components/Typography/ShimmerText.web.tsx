import { Text } from "./Text";
import { useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import type { TextProps } from "./types";

interface ShimmerTextProps extends Omit<TextProps, "children"> {
  children: string | ReactNode;
  duration?: number;
  baseColor?: string;
  shineColor?: string;
  /** When true, shimmer runs once then text is shown in default color */
  once?: boolean;
}

export const ShimmerText: FC<ShimmerTextProps> = ({
  children,
  duration = 3000,
  baseColor,
  shineColor,
  once = false,
  ...textProps
}) => {
  const theme = useTheme();
  const [shimmerDone, setShimmerDone] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (once) {
      timer = setTimeout(() => setShimmerDone(true), duration);
    }
    return () => clearTimeout(timer);
  }, [once, duration]);

  // Auto-detect colors based on theme
  const finalBaseColor =
    baseColor || theme.colors.textHint || "rgba(152, 162, 179, 1)";
  const finalShineColor =
    shineColor ||
    (theme.name === "dark" || theme.name === "dark-vibrant"
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(255, 255, 255, 1)");

  if (!children) return null;

  const animationName = "shimmer-slide";

  if (typeof document !== "undefined") {
    const styleId = "shimmer-text-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes ${animationName} {
          from { background-position-x: 100%; }
          to   { background-position-x: 0%; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  if (once && shimmerDone) {
    return (
      <Text {...textProps} style={[textProps.style]}>
        {children}
      </Text>
    );
  }

  const animationValue = once
    ? `${animationName} ${duration}ms linear 1`
    : `${animationName} ${duration}ms linear infinite`;

  return (
    <View style={{ overflow: "hidden" }}>
      <Text
        {...textProps}
        style={[
          textProps.style,
          {
            background: `linear-gradient(-45deg, ${finalBaseColor} 40%, ${finalShineColor} 50%, ${finalBaseColor} 60%)`,
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: animationValue,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};
