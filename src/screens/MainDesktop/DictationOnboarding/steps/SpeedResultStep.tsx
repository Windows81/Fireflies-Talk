import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { View, type DimensionValue } from "react-native";
import { OnboardingCardLayout } from "../OnboardingCardLayout";
import { SpeedBar } from "../components/SpeedBar";
import {
  AVERAGE_TYPING_WPM,
  formatMultiplier,
  isFasterThanTyping,
  speedMultiplier,
} from "../speakingSpeed";

interface SpeedResultStepProps {
  /** Null when the dictation was too short or empty to measure. */
  spokenWpm: number | null;
  onComplete: () => void;
}

const CARD_STYLE = {
  maxWidth: 622,
  borderRadius: 32,
  paddingTop: 40,
  paddingBottom: 48,
  paddingHorizontal: 48,
  backgroundColor: DESKTOP_THEME.grey1050,
  borderColor: DESKTOP_THEME.grey950,
  boxShadow:
    "0px 3px 8px rgba(0, 0, 0, 0.13), 0px 2px 5px rgba(0, 0, 0, 0.13), 0px 1px 1px rgba(0, 0, 0, 0.13)",
};

export const SpeedResultStep: FC<SpeedResultStepProps> = ({
  spokenWpm,
  onComplete,
}) => {
  const faster = spokenWpm !== null && isFasterThanTyping(spokenWpm);

  // Bars are drawn in proportion to each other, so the comparison is legible
  // before the numbers are read. The faster rate takes the full width.
  const typingShare: DimensionValue = spokenWpm
    ? `${Math.min(100, Math.round((AVERAGE_TYPING_WPM / spokenWpm) * 100))}%`
    : "100%";

  return (
    <OnboardingCardLayout cardStyle={CARD_STYLE}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text variant="heading3" color="textPrimary">
            🎉
          </Text>

          <View style={styles.headline}>
            <Text
              variant="heading3"
              color="textPrimary"
              style={styles.centered}
              accessibilityRole="header"
            >
              {faster
                ? `You just typed ${formatMultiplier(speedMultiplier(spokenWpm))} faster!`
                : "You just typed with your voice!"}
            </Text>
            <Text
              variant="title1Regular"
              color="textSecondary"
              style={styles.centered}
            >
              {faster
                ? "than the avg. typing speed"
                : "Talk works anywhere you type"}
            </Text>
          </View>
        </View>

        {/* With no measured rate there is nothing to compare the typing
            average to, and a lone bar states a fact nobody asked for. */}
        {spokenWpm !== null && (
          <View style={styles.bars}>
            <SpeedBar
              wordsPerMinute={AVERAGE_TYPING_WPM}
              caption="AVG. TYPING SPEED"
              width={typingShare}
            />
            <SpeedBar
              wordsPerMinute={spokenWpm}
              caption="YOUR VOICE"
              width="100%"
              highlighted
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          size="md"
          style={styles.continueButton}
          onPress={onComplete}
        >
          Start Dictating
        </Button>
      </View>
    </OnboardingCardLayout>
  );
};

const styles = createStyles({
  wrapper: {
    alignSelf: "stretch" as const,
    alignItems: "center" as const,
    gap: 64,
  },
  header: {
    alignItems: "center" as const,
    gap: 12,
  },
  headline: {
    alignItems: "center" as const,
    gap: 4,
  },
  centered: {
    textAlign: "center" as const,
  },
  bars: {
    alignSelf: "stretch" as const,
    gap: 40,
  },
  footer: {
    alignSelf: "stretch" as const,
    alignItems: "center" as const,
    marginTop: 40,
  },
  continueButton: {
    width: 210,
    borderRadius: 6,
  },
});
