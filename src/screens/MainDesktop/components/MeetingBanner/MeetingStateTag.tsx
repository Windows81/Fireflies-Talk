import { useEffect, type FC } from "react";
import { Text } from "@/components/Typography";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";

interface MeetingStateTagProps {
  isLive: boolean;
}

const PULSE_DURATION_MS = 900;

/**
 * "LIVE" / "UPCOMING" tag. The live variant subtly pulses its red background
 * color (not opacity) so the label text stays fully legible.
 */
export const MeetingStateTag: FC<MeetingStateTagProps> = ({ isLive }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!isLive) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, {
        duration: PULSE_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [isLive, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [DESKTOP_THEME.red1000, DESKTOP_THEME.red800],
    ),
  }));

  return (
    <Animated.View
      style={[styles.tag, isLive && styles.tagLive, isLive && animatedStyle]}
    >
      <Text
        variant="body3Regular"
        style={[styles.tagText, isLive && styles.tagTextLive]}
      >
        {isLive ? "LIVE" : "UPCOMING"}
      </Text>
    </Animated.View>
  );
};

const styles = createStyles({
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: DESKTOP_THEME.grey900,
  },
  tagLive: {
    backgroundColor: DESKTOP_THEME.red1000,
  },
  tagText: {
    color: DESKTOP_THEME.grey700,
    letterSpacing: -0.1,
  },
  tagTextLive: {
    color: "#FFD5D8",
  },
});
