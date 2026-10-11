import { useTheme } from "@/styles";
import { useAppState } from "@/utils/app-state";
import type { FC } from "react";
import { useEffect } from "react";
import type { DimensionValue } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const SkeletonLoading: FC<{
  width: DimensionValue;
  height: DimensionValue;
  variant?: "circle" | "rect" | "rounded";
}> = ({ width, height, variant }) => {
  const theme = useTheme();
  const appState = useAppState();

  const opacityValue = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(opacityValue);

    if (appState !== "active") {
      opacityValue.value = 1;
      return;
    }

    opacityValue.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, reduceMotion: ReduceMotion.Never }),
        withTiming(1, { duration: 1500, reduceMotion: ReduceMotion.Never }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    return () => {
      cancelAnimation(opacityValue);
    };
  }, [opacityValue, appState]);

  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: opacityValue.value }),
    [],
  );

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.miscellaneousSkeletonElement,
          borderRadius:
            variant === "circle" ? 9999 : variant === "rect" ? 0 : 8,
          maxWidth: "100%",
        },
        animatedStyle,
        { width, height },
      ]}
    />
  );
};
