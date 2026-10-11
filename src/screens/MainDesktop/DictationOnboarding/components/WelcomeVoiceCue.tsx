import { IconLogo } from "@/assets/svg";
import { ShimmerText } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { useEffect, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { WelcomeDemoPhase } from "../useWelcomeDemoLoop";

const WAVE_BARS = 6;
const WAVE_HEIGHTS = [8, 14, 10, 16, 9, 12];
const BAR_WIDTH = 2;
/** Resting as a round dot, and the trough each breath falls back to. */
const BAR_REST_HEIGHT = BAR_WIDTH;
const BAR_TROUGH_HEIGHT = 4;
const BEAT_MS = 360;
const TEXT_GAP = 4;
const GROW_MS = 260;

interface WelcomeVoiceCueProps {
  phase: WelcomeDemoPhase;
}

/** One waveform bar that breathes while listening and rests as a dot. */
const WaveBar: FC<{ index: number; listening: boolean }> = ({
  index,
  listening,
}) => {
  const theme = useTheme();
  const height = useSharedValue(BAR_REST_HEIGHT);

  useEffect(() => {
    if (!listening) {
      cancelAnimation(height);
      height.value = withTiming(BAR_REST_HEIGHT, { duration: 200 });
      return;
    }
    const peak = WAVE_HEIGHTS[index % WAVE_HEIGHTS.length];
    height.value = withRepeat(
      withSequence(
        withTiming(peak, { duration: BEAT_MS + index * 40 }),
        withTiming(BAR_TROUGH_HEIGHT, { duration: BEAT_MS + index * 40 }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(height);
  }, [listening, index, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.waveBar(theme), animatedStyle]} />;
};

/** The pill only opens up for the polishing label; otherwise it stays shut. */
const textWidthFor = (phase: WelcomeDemoPhase, labelWidth: number): number =>
  phase === "polishing" ? labelWidth : 0;

/** The pill widens to fit `targetWidth` of text and closes back to nothing. */
const useGrow = (targetWidth: number) => {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(targetWidth, { duration: GROW_MS });
  }, [targetWidth, width]);
  return useAnimatedStyle(() => ({
    width: width.value,
    marginLeft: Math.min(width.value / 10, 1) * TEXT_GAP,
  }));
};

/**
 * The Talk pill as it works: its waves breathe while the person speaks, it
 * opens up to say it is polishing, then it rests once the email has landed.
 */
export const WelcomeVoiceCue: FC<WelcomeVoiceCueProps> = ({ phase }) => {
  const listening = phase === "speaking";
  const polishing = phase === "polishing";
  const [labelWidth, setLabelWidth] = useState(0);

  const textStyle = useGrow(textWidthFor(phase, labelWidth));

  const onLabelLayout = (event: LayoutChangeEvent) =>
    setLabelWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.pill}>
      <IconLogo width={20} height={20} />
      <View style={styles.wave}>
        {Array.from({ length: WAVE_BARS }, (_, i) => (
          <WaveBar key={i} index={i} listening={listening} />
        ))}
      </View>
      <Animated.View style={[styles.text, textStyle]}>
        <View
          style={[styles.label, !polishing && styles.labelHidden]}
          onLayout={onLabelLayout}
        >
          <ShimmerText variant="body2Weight" duration={1200} numberOfLines={1}>
            Polishing with Fireflies
          </ShimmerText>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = createStyles({
  pill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    height: 36,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 48,
    backgroundColor: DESKTOP_THEME.grey950,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey900,
  },
  wave: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    height: 18,
  },
  waveBar: (theme) => ({
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH,
    backgroundColor: theme.colors.textPrimary,
  }),
  text: {
    height: 20,
    overflow: "hidden" as const,
  },
  // Always laid out so the pill knows how wide to open before polishing.
  label: {
    position: "absolute" as const,
    left: 0,
    top: 0,
    flexDirection: "row" as const,
  },
  labelHidden: {
    opacity: 0,
  },
});
