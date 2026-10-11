import { useAppState } from "@/utils/app-state";
import { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";

const useNativeDriver = Platform.OS !== "web";

export const usePulseAnimatedStyle = (
  duration = 2800,
  peakOpacity = 1,
  enabled = true,
) => {
  const opacity = useRef(new Animated.Value(peakOpacity)).current;
  const appState = useAppState();

  useEffect(() => {
    if (!enabled || appState !== "active") {
      opacity.setValue(peakOpacity);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(duration / 3),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration / 6,
          useNativeDriver,
        }),
        Animated.delay(duration / 3),
        Animated.timing(opacity, {
          toValue: peakOpacity,
          duration: duration / 6,
          useNativeDriver,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, duration, peakOpacity, appState, enabled]);

  return { opacity };
};
