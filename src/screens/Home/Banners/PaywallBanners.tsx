import { IconAlertCircle, IconZap } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { PaywallVisibility } from "@firefliesai/mobile-ff.graphql-client";
import {
  startUpgradeFlow,
  useBilling,
  useShouldShowUnlimitedRecordingCampaign,
  usePaywallConfig,
} from "@/features/billing";
import { createStyles, type Theme, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

const PaywallBanner: FC<{
  description: string;
  backgroundColor: string;
  iconColor: string;
  borderColor: string;
  textColor: keyof Theme["colors"];
  pwl: string;
}> = ({
  description,
  backgroundColor,
  iconColor,
  pwl,
  borderColor,
  textColor,
}) => {
  const theme = useTheme();
  const { visibility } = usePaywallConfig();

  return (
    <View style={[styles.banner, { backgroundColor, borderColor }]}>
      <View style={styles.leading}>
        <IconAlertCircle
          style={styles.alertIcon}
          color={iconColor}
          width={16}
          height={16}
        />
        <Text style={styles.fill} variant="body2Regular" color={textColor}>
          {description}
        </Text>
      </View>
      {visibility === PaywallVisibility.Show && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            style={styles.fill}
            size="sm"
            Icon={() => (
              <IconZap
                style={styles.upgradeButtonIcon}
                width={20}
                height={20}
                color={theme.colors.layerDefault}
                fill={theme.colors.layerDefault}
              />
            )}
            onPress={() => startUpgradeFlow({ pwl })}
          >
            Upgrade
          </Button>
        </View>
      )}
    </View>
  );
};

export const useShowPaywallBanners = () => {
  const { reachedTeamMinutesConsumedLimit, reachedFreeMeetingsLimit } =
    useBilling();

  const { visibility } = usePaywallConfig();

  return (
    (reachedTeamMinutesConsumedLimit || reachedFreeMeetingsLimit) &&
    visibility !== PaywallVisibility.Hidden
  );
};

export const PaywallBanners: FC = () => {
  const { reachedTeamMinutesConsumedLimit, reachedFreeMeetingsLimit } =
    useBilling();
  const { visibility } = usePaywallConfig();

  const shouldMentionUnlimitedRecording =
    useShouldShowUnlimitedRecordingCampaign();

  const theme = useTheme();

  if (
    (!reachedTeamMinutesConsumedLimit && !reachedFreeMeetingsLimit) ||
    visibility === PaywallVisibility.Hidden
  ) {
    return null;
  }

  return (
    <View style={styles.banners}>
      {reachedFreeMeetingsLimit && !reachedTeamMinutesConsumedLimit && (
        <PaywallBanner
          description={`You're out of AI credits. Upgrade today to transcribe your meetings.${
            !shouldMentionUnlimitedRecording
              ? " You can still transcribe unlimited voice notes."
              : ""
          }`}
          backgroundColor={theme.colors.rainbowStaticTealSubtle}
          iconColor={theme.colors.rainbowStaticCyanText}
          pwl="mobile_feed-credits"
          textColor="rainbowStaticCyanText"
          borderColor={theme.colors.rainbowInteractiveCyanDisabled}
        />
      )}
      {reachedTeamMinutesConsumedLimit && (
        <PaywallBanner
          description="You're out of storage. Upgrade today to view latest meetings."
          backgroundColor={theme.colors.informationStaticYellowSubtle}
          iconColor={theme.colors.informationStaticYellowText}
          pwl="mobile_feed-storage"
          textColor="informationStaticYellowText"
          borderColor={theme.colors.informationInteractiveYellowDisabled}
        />
      )}
    </View>
  );
};

const styles = createStyles({
  banners: {
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  banner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  leading: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
  },
  alertIcon: {
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  upgradeButtonIcon: {
    marginRight: 8,
  },
  fill: {
    flex: 1,
  },
});
