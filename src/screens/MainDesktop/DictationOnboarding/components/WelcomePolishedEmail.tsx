import { Text } from "@/components/Typography";
import type { FC } from "react";
import { View } from "react-native";
import {
  POLISHED_REVEAL_DELAY_MS,
  POLISHED_WORD_FADE_MS,
  POLISHED_WORD_STAGGER_MS,
} from "../useWelcomeDemoLoop";
import { WELCOME_POLISHED_LINES } from "../welcomeDemoCopy";
import { RevealWord } from "./RevealWord";

/** The whole email drops out together when the loop starts over. */
const HIDE_MS = 200;

interface WelcomePolishedEmailProps {
  /** Whether the finished email should be on screen. */
  visible: boolean;
}

/** Each line's words and where its first word sits in the reading order. */
const LINES = (() => {
  let start = 0;
  return WELCOME_POLISHED_LINES.map((line) => {
    const words = line ? line.split(" ") : [];
    const entry = { words, start };
    start += words.length;
    return entry;
  });
})();

/**
 * The polished email, landing softly one word at a time in reading order.
 * Every word is always laid out so the card never changes height mid-reveal.
 */
export const WelcomePolishedEmail: FC<WelcomePolishedEmailProps> = ({
  visible,
}) => (
  <View>
    {LINES.map(({ words, start }, lineIndex) => (
      <Text key={lineIndex} variant="body2LongRegular" color="textSecondary">
        {words.length === 0
          ? " "
          : words.map((word, wordIndex) => (
              <RevealWord
                key={wordIndex}
                word={word}
                visible={visible}
                delayMs={
                  POLISHED_REVEAL_DELAY_MS +
                  (start + wordIndex) * POLISHED_WORD_STAGGER_MS
                }
                fadeMs={POLISHED_WORD_FADE_MS}
                hideMs={HIDE_MS}
              />
            ))}
      </Text>
    ))}
  </View>
);
