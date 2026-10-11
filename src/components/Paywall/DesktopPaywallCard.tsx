import { IconSparkleGradient, IconSend } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { startUpgradeFlow, useBilling } from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import { createStyles, useTheme } from "@/styles";
import { isDesktop } from "@/utils/device";
import type { ReactNode } from "react";
import { useCallback, useEffect, type FC } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface DesktopPaywallCardProps {
  title: string;
  description: string;
  pwl: string;
  forAskFred?: boolean;
  from: string;
  /** Shows the remaining-credits badge. Never shown to free users, who have none. */
  showCreditsInfo?: boolean;
  ctaText?: string;
  /**
   * Sits above the copy. Live Assist surfaces pass a preview of the feature
   * being sold; without one the card falls back to a generic mark.
   */
  icon?: ReactNode;
}

export const DesktopPaywallCard: FC<DesktopPaywallCardProps> = ({
  title,
  description,
  pwl,
  forAskFred = false,
  from,
  showCreditsInfo = false,
  ctaText = "Subscribe Now",
  icon,
}) => {
  const theme = useTheme();
  const { isFreeUser, monthlyAICreditsUsed, monthlyAICreditsLimit } =
    useBilling();

  const creditsLeft = Math.max(0, monthlyAICreditsLimit - monthlyAICreditsUsed);
  // Free users have no credit balance to report.
  const showCredits = showCreditsInfo && !isFreeUser;

  useEffect(() => {
    trackPaywallShown({
      paywall: pwl,
      from,
    });
  }, [pwl, from]);

  const handleUpgrade = useCallback(() => {
    startUpgradeFlow({ pwl, forAskFred });
  }, [pwl, forAskFred]);

  // Don't render on mobile
  if (!isDesktop) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.preview, forAskFred && styles.previewAskFred]}>
          {icon ?? <FallbackIcon forAskFred={forAskFred} />}

          {showCredits && (
            <View style={styles.credits(theme)}>
              <Text variant="body3Regular" color="textMuted">
                {creditsLeft} AI CREDITS
              </Text>
            </View>
          )}
        </View>

        <View style={styles.message}>
          <View style={styles.copy}>
            <Text
              variant="title2Regular"
              color="textSecondary"
              style={styles.centered}
            >
              {title}
            </Text>
            <Text
              variant="body2Regular"
              color="textMuted"
              style={styles.centered}
            >
              {description}
            </Text>
          </View>

          <Button size="sm" onPress={handleUpgrade}>
            {ctaText}
          </Button>
        </View>
      </View>
    </View>
  );
};

const FallbackIcon: FC<{ forAskFred: boolean }> = ({ forAskFred }) => {
  const theme = useTheme();

  if (forAskFred) {
    return (
      <LinearGradient
        colors={["#C7DD3F", "#48DEFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.askFredIconContainer}
      >
        <IconSend width={24} height={24} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.iconContainer(theme)}>
      <IconSparkleGradient width={32} height={32} />
    </View>
  );
};

const styles = createStyles({
  // Grows to fill a tall panel so the card centres in it, but never shrinks
  // below its content — `flex: 1` would zero the basis and let a content-sized
  // parent clip the CTA. Padding is asymmetric per Figma: the surrounding
  // panel header already supplies the gap above.
  container: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 32,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
    gap: 20,
  },
  preview: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  // The compact AskFred chip sits closer to its credits badge than the larger
  // Live Assist suggestion preview does.
  previewAskFred: {
    gap: 16,
  },
  // Capped to the design's measure so the description breaks where intended.
  message: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: 8,
    gap: 32,
  },
  copy: {
    width: "100%",
    gap: 8,
  },
  centered: {
    textAlign: "center",
  },
  iconContainer: (theme) => ({
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: theme.colors.rainbowStaticPurpleSubtle,
    alignItems: "center",
    justifyContent: "center",
  }),
  askFredIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  credits: (theme) => ({
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.interactiveNeutral3Default,
  }),
});
