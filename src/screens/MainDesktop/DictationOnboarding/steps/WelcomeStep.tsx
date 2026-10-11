import { IconArrowRight, IconLogoText } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { Fonts } from "@/styles/typography";
import type { FC } from "react";
import { View } from "react-native";
import { OnboardingLayout } from "../OnboardingLayout";
import { WelcomeEmailPreview } from "../components/WelcomeEmailPreview";
import { WelcomeVoiceCue } from "../components/WelcomeVoiceCue";
import { useWelcomeDemoLoop } from "../useWelcomeDemoLoop";

interface WelcomeStepProps {
  onNext: () => void;
  onClose: () => void;
}

export const WelcomeStep: FC<WelcomeStepProps> = ({ onNext, onClose }) => {
  const theme = useTheme();
  const demo = useWelcomeDemoLoop();

  return (
    <OnboardingLayout
      onClose={onClose}
      rightContent={
        <View style={styles.visual}>
          <WelcomeEmailPreview
            phase={demo.phase}
            spokenCount={demo.spokenCount}
          />
          <WelcomeVoiceCue phase={demo.phase} />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.intro}>
          <IconLogoText width={121} height={30} color={DESKTOP_THEME.grey100} />
          <View style={styles.header}>
            <Text variant="label1Weight" color="textSecondary">
              Meet Fireflies Talk
            </Text>
            <Text
              variant="heading4Weight"
              color="textPrimary"
              style={styles.title}
            >
              Say it instead of typing it
            </Text>
            <Text variant="title1Regular" color="textSecondary">
              Unlimited dictation, free on every plan.
            </Text>
          </View>
        </View>

        <View style={styles.cta}>
          {/* Children rather than the Icon prop, which renders ahead of the
            label — here the arrow trails it. */}
          <Button
            variant="primary"
            size="md"
            onPress={onNext}
            style={styles.button}
          >
            <View style={styles.buttonInner}>
              <Text variant="label2Weight" color="commandContrastDefault">
                Let&apos;s Get Started
              </Text>
              <IconArrowRight
                width={20}
                height={20}
                color={theme.colors.commandContrastDefault}
              />
            </View>
          </Button>
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = createStyles({
  // Sits a little above centre, so the block reads against the email rather
  // than level with it.
  content: {
    alignSelf: "stretch" as const,
    alignItems: "flex-start" as const,
    maxWidth: 426,
    gap: 56,
    marginBottom: 102,
  },
  intro: {
    alignSelf: "stretch" as const,
    gap: 24,
  },
  header: {
    alignSelf: "stretch" as const,
    gap: 16,
  },
  // The heading weight variants stop at medium; the welcome title is bold.
  title: {
    fontFamily: Fonts.dmSans["700"].regular,
    fontWeight: "700" as const,
  },
  cta: {
    alignSelf: "stretch" as const,
    alignItems: "flex-start" as const,
    gap: 16,
  },
  button: {
    width: 173,
    borderRadius: 6,
    paddingLeft: 20,
    paddingRight: 16,
  },
  buttonInner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  visual: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 24,
    gap: 72,
  },
});
