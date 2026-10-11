import { IconLogo } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import {
  FREE_TRIAL_ANNUAL_DISCOUNT_PCT,
  FREE_TRIAL_ANNUAL_PER_MONTH_USD,
  FREE_TRIAL_DAYS,
} from "@/features/free-trial";
import { formatUsd } from "@/utils/price";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { View } from "react-native";
import { useOnboarding } from "../../../OnboardingContext";
import { PitchBenefits } from "./PitchBenefits";
import { PitchRating } from "./PitchRating";

export const FreeTrialPitch: FC = () => {
  const { goNext, skipFreeTrial } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <View style={styles.header}>
            <LinearGradient
              colors={["#363637", "#1E1E1F", "#151617"]}
              locations={[0, 0.38161, 1]}
              style={styles.appIcon}
            >
              <IconLogo width={28} height={28} />
            </LinearGradient>
            <View style={styles.titleBlock}>
              <Text variant="heading4Weight" color="textSecondary">
                Start your {FREE_TRIAL_DAYS} days free trial
              </Text>
              <View style={styles.subheader}>
                <Text variant="body2Regular" color="commandNeutralDisabled">
                  $0 due today, then{" "}
                  {formatUsd(FREE_TRIAL_ANNUAL_PER_MONTH_USD)}/month.
                </Text>
                <View style={styles.discountBadge}>
                  <Text variant="body3Regular" style={styles.discountBadgeText}>
                    Upto {FREE_TRIAL_ANNUAL_DISCOUNT_PCT}% OFF
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <PitchBenefits />
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            size="md"
            style={styles.startButton}
            onPress={goNext}
          >
            <Text variant="label2Weight" color="layerContrast">
              Start Free Trial
            </Text>
          </Button>
          <Button
            variant="text"
            size="md"
            style={styles.skipButton}
            onPress={skipFreeTrial}
          >
            <Text variant="label2Weight" color="textHint">
              Skip
            </Text>
          </Button>
        </View>
      </View>

      <PitchRating />
    </View>
  );
};

const styles = createStyles({
  container: {
    alignItems: "center",
    alignSelf: "center",
    gap: 88,
    width: "100%",
  },
  card: {
    width: 420,
    backgroundColor: DESKTOP_THEME.grey1100,
    borderColor: "#2F2E33",
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 24,
    gap: 64,
    boxShadow:
      "0 4px 4px 0 rgba(0, 0, 0, 0.10), 0 0 32px 2px rgba(255, 255, 255, 0.12) inset",
    backdropFilter: "blur(50px)",
  },
  cardInner: {
    gap: 32,
  },
  header: {
    gap: 32,
    alignItems: "flex-start",
    width: "100%",
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow:
      "inset 2.154px 2.154px 2.154px 0px rgba(255, 255, 255, 0.16), inset 0px 0px 8.615px 0px rgba(255, 255, 255, 0.10)",
  },
  titleBlock: {
    gap: 6,
    alignItems: "flex-start",
    width: "100%",
  },
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountBadge: {
    backgroundColor: "#002E1B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadgeText: {
    color: "#23C035",
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  startButton: {
    width: "100%",
    height: 40,
    backgroundColor: DESKTOP_THEME.purple600,
    paddingHorizontal: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    width: "100%",
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
