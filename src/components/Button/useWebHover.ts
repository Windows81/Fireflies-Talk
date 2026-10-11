import { useState } from "react";
import { Platform } from "react-native";
import type { MouseEvent, PressableProps } from "react-native";

export const useWebHover = (
  props?: Pick<PressableProps, "onHoverIn" | "onHoverOut">,
) => {
  const [isHovered, setIsHovered] = useState(false);

  const webHoverProps =
    Platform.OS === "web"
      ? {
          onHoverIn: (e: MouseEvent) => {
            setIsHovered(true);
            props?.onHoverIn?.(e);
          },
          onHoverOut: (e: MouseEvent) => {
            setIsHovered(false);
            props?.onHoverOut?.(e);
          },
        }
      : {};

  return {
    isHovered,
    webHoverProps,
  };
};
