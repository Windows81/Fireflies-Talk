import { IconLogo, IconTalkBannerPill } from "@/assets/svg";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BAR_HEIGHTS = [6, 8, 4, 6];
const BAR_REST = 2;
const BEAT_MS = 360;
const SWAP_MS = 220;

interface WaveBarProps {
  index: number;
  listening: boolean;
}

interface TalkIntroPillProps {
  /** Whether the pill is in talk mode, hearing the person speak. */
  listening: boolean;
}

/** One waveform bar that breathes while listening and rests as a dot. */
const WaveBar: FC<WaveBarProps> = ({ index, listening }) => {
  const peak = BAR_HEIGHTS[index % BAR_HEIGHTS.length];
  const beatMs = BEAT_MS + index * 40;

  const animatedStyle = useAnimatedStyle(() => {
    if (!listening) return { height: withTiming(BAR_REST, { duration: 200 }) };

    return {
      height: withRepeat(
        withSequence(
          withTiming(peak, { duration: beatMs }),
          withTiming(BAR_REST, { duration: beatMs }),
        ),
        -1,
        true,
      ),
    };
  }, [listening, peak, beatMs]);

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

/** Fades to `visible` and back; both pill faces share the same spot. */
const useSwap = (visible: boolean) =>
  useAnimatedStyle(
    () => ({ opacity: withTiming(visible ? 1 : 0, { duration: SWAP_MS }) }),
    [visible],
  );

/**
 * The Talk pill at the bottom of the banner: a resting sliver of dots while
 * nothing is happening, and the logo with a breathing waveform in talk mode.
 */
export const TalkIntroPill: FC<TalkIntroPillProps> = ({ listening }) => {
  const idleStyle = useSwap(!listening);
  const talkStyle = useSwap(listening);

  return (
    <View style={styles.slot} pointerEvents="none">
      <Animated.View style={[styles.idle, idleStyle]}>
        <IconTalkBannerPill width={27} height={10} />
      </Animated.View>
      <Animated.View style={[styles.talk, talkStyle]}>
        <IconLogo width={12} height={12} />
        <View style={styles.bars}>
          {BAR_HEIGHTS.map((_, index) => (
            <WaveBar key={index} index={index} listening={listening} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = createStyles({
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 206,
    height: 20,
    alignItems: "center",
  },
  idle: {
    position: "absolute",
    top: 10,
  },
  talk: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: withAlpha(DESKTOP_THEME.grey1200, 0.1),
  },
  bars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 12,
  },
  bar: {
    width: 1.5,
    borderRadius: 8,
    backgroundColor: DESKTOP_THEME.grey400,
  },
});
