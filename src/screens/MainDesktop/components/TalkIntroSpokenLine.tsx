import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const WORD_FADE_MS = 320;
const LINE_FADE_MS = 200;

interface HeardWordProps {
  heard: boolean;
  word: string;
}

interface TalkIntroSpokenLineProps {
  /** The whole sentence, laid out up front so the line never reflows. */
  words: readonly string[];
  /** How many of `words` have been heard so far. */
  heardCount: number;
  /** Whether the pill is still listening; the line fades away otherwise. */
  visible: boolean;
}

/** One word of the sentence, landing softly the moment it is heard. */
const HeardWord: FC<HeardWordProps> = ({ heard, word }) => {
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(heard ? 1 : 0, {
        duration: WORD_FADE_MS,
        easing: Easing.out(Easing.cubic),
      }),
    }),
    [heard],
  );

  return <Animated.Text style={animatedStyle}>{word} </Animated.Text>;
};

/**
 * What the person is saying, centered above the pill. Every word is always
 * laid out so the line keeps its shape while the words fill in one by one.
 */
export const TalkIntroSpokenLine: FC<TalkIntroSpokenLineProps> = ({
  words,
  heardCount,
  visible,
}) => {
  const lineStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(visible ? 1 : 0, { duration: LINE_FADE_MS }),
    }),
    [visible],
  );

  if (words.length === 0) return null;

  return (
    <Animated.View style={[styles.slot, lineStyle]} pointerEvents="none">
      <Text variant="body3Regular" style={styles.line}>
        {words.map((word, index) => (
          <HeardWord
            key={`${index}-${word}`}
            heard={index < heardCount}
            word={word}
          />
        ))}
      </Text>
    </Animated.View>
  );
};

const styles = createStyles({
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: "center",
  },
  line: {
    width: 212,
    textAlign: "center",
    color: withAlpha(DESKTOP_THEME.grey100, 0.6),
  },
});
