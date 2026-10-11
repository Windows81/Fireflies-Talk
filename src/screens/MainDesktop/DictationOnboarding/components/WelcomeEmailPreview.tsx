import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { WelcomeDemoPhase } from "../useWelcomeDemoLoop";
import {
  POLISHED_REVEAL_DELAY_MS,
  SPOKEN_WORD_FADE_MS,
} from "../useWelcomeDemoLoop";
import { WELCOME_SPOKEN_WORDS } from "../welcomeDemoCopy";
import { GmailIcon } from "./GmailIcon";
import { RevealWord } from "./RevealWord";
import { WelcomePolishedEmail } from "./WelcomePolishedEmail";

/** Raw text eases between states in the gap before polished words land. */
const FADE_MS = POLISHED_REVEAL_DELAY_MS;
/** The raw words sit back while the pill polishes them. */
const RAW_POLISHING_OPACITY = 0.45;

interface WelcomeEmailPreviewProps {
  phase: WelcomeDemoPhase;
  /** How many raw words have been heard so far; they land before the polish. */
  spokenCount: number;
}

/** Eases to `target` opacity as it changes. */
const useOpacity = (target: number) => {
  const opacity = useSharedValue(target);
  useEffect(() => {
    opacity.value = withTiming(target, { duration: FADE_MS });
  }, [target, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};

const rawOpacityFor = (phase: WelcomeDemoPhase): number => {
  if (phase === "speaking") return 1;
  return phase === "polishing" ? RAW_POLISHING_OPACITY : 0;
};

/**
 * The welcome screen's email: raw speech lands word by word, sits back while
 * the pill polishes it, and the finished email settles in word by word. A
 * still mockup, not the live one the demo steps dictate into, which is why it
 * does not share AppMockup.
 */
export const WelcomeEmailPreview: FC<WelcomeEmailPreviewProps> = ({
  phase,
  spokenCount,
}) => {
  const theme = useTheme();
  const rawStyle = useOpacity(rawOpacityFor(phase));

  return (
    <View style={styles.card}>
      <View style={styles.header(theme)}>
        <GmailIcon />
        <Text variant="body2Weight" color="textSecondary">
          Gmail
        </Text>
      </View>

      <View style={styles.subject}>
        <Text variant="body1Regular" color="textMuted">
          Subject : Quick follow-up
        </Text>
        <View style={styles.divider} />
      </View>

      <View
        style={styles.message}
        accessibilityRole="image"
        accessibilityLabel="Example: a spoken rough draft becomes a polished email"
      >
        <WelcomePolishedEmail visible={phase === "polished"} />

        {/* The raw layer is already invisible when the loop restarts, so its
          words can drop out at once without a flash. */}
        <Animated.View style={[styles.layer, rawStyle]}>
          <Text variant="body2LongRegular" color="textMuted">
            {WELCOME_SPOKEN_WORDS.map((word, index) => (
              <RevealWord
                key={index}
                word={word}
                visible={index < spokenCount}
                fadeMs={SPOKEN_WORD_FADE_MS}
                hideMs={0}
              />
            ))}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = createStyles({
  // width rather than alignSelf:"stretch" — a stretched item with a maxWidth
  // stops honouring the parent's centring and sits flush left.
  card: {
    width: "100%" as const,
    maxWidth: 642,
    backgroundColor: DESKTOP_THEME.grey1050,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    overflow: "hidden" as const,
  },
  header: (theme) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.06),
  }),
  subject: {
    paddingTop: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: DESKTOP_THEME.grey950,
  },
  // Deeper bottom padding than top, so the signature is not crowded against
  // the card edge the way an even inset would leave it. The polished email
  // sizes the block; the other states are layered over it so nothing jumps.
  message: {
    paddingTop: 24,
    paddingBottom: 56,
    paddingHorizontal: 24,
  },
  layer: {
    position: "absolute" as const,
    top: 24,
    left: 24,
    right: 24,
    bottom: 56,
  },
});
