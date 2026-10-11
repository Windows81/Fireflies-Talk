import { createStyles, useTheme } from "@/styles";
import { useAppState } from "@/utils/app-state";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

interface AnimatedAudioWaveProps {
  recordingState: "inactive" | "recording" | "paused";
}

export const AnimatedAudioWave = ({
  recordingState,
}: AnimatedAudioWaveProps) => {
  const theme = useTheme();
  const appState = useAppState();

  const height1 = useSharedValue(4);
  const height2 = useSharedValue(12);
  const height3 = useSharedValue(8);

  useEffect(() => {
    // Cancel any existing animations before starting new ones
    cancelAnimation(height1);
    cancelAnimation(height2);
    cancelAnimation(height3);

    if (appState !== "active") {
      // Stop animations when app is in background to avoid ANR
      height1.value = 4;
      height2.value = 12;
      height3.value = 8;
      return;
    }

    if (recordingState === "recording") {
      const animate = () => {
        height1.value = withRepeat(
          withSequence(
            withTiming(12, {
              duration: 700,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );

        height2.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            withTiming(12, {
              duration: 700,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          true,
        );

        height3.value = withRepeat(
          withSequence(
            withTiming(8, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            withTiming(14, {
              duration: 700,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
      };

      animate();
    } else {
      // Reset to default heights when not recording
      height1.value = withTiming(4, { duration: 300 });
      height2.value = withTiming(12, { duration: 300 });
      height3.value = withTiming(8, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- no need for shared values
  }, [recordingState, appState]);

  const line1Style = useAnimatedStyle(() => ({
    height: height1.value,
  }));

  const line2Style = useAnimatedStyle(() => ({
    height: height2.value,
  }));

  const line3Style = useAnimatedStyle(() => ({
    height: height3.value,
  }));

  return (
    <View style={styles.container}>
      {recordingState !== "inactive" && (
        <>
          <Animated.View style={[styles.bar(theme), line1Style]} />
          <Animated.View style={[styles.bar(theme), line2Style]} />
          <Animated.View style={[styles.bar(theme), line3Style]} />
        </>
      )}
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    gap: 4,
  },
  bar: (theme) => ({
    width: 2,
    height: 8,
    backgroundColor: theme.colors.textBrand,
    borderRadius: 1,
  }),
});
