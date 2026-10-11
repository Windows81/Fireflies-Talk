import { IconMic } from "@/assets/svg";
import { LinkButton } from "@/components/Button";
import { StaticTag } from "@/components/Tag";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useShouldShowUnlimitedRecordingCampaign } from "@/features/billing";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

export const MobileRecordBanner: FC = () => {
  const theme = useTheme();

  const shouldShow = useShouldShowUnlimitedRecordingCampaign();
  if (!shouldShow) return null;

  return (
    <View style={styles.mobileRecordBanner(theme)}>
      <View style={styles.mobileRecordBannerLeading}>
        <View style={styles.mobileRecordBannerIcon(theme)}>
          <IconMic
            color={theme.colors.rainbowStaticTealSolid}
            width={20}
            height={20}
          />
        </View>
        <Text
          variant="title3Regular"
          color="textPrimary"
          style={styles.mobileRecordBannerText}
        >
          Transcribe Unlimited Voice Notes
        </Text>
        <StaticTag color="cyan" style={styles.mobileRecordFreeTag}>
          FREE
        </StaticTag>
      </View>
      <LinkButton size="sm" href={RouteNames.Record}>
        Record
      </LinkButton>
    </View>
  );
};

const styles = createStyles({
  mobileRecordBanner: (theme) => ({
    backgroundColor: theme.colors.layerBrandLight1,
    borderRadius: 4,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  }),
  mobileRecordBannerLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  mobileRecordBannerText: {
    flex: 1,
  },
  mobileRecordBannerIcon: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  }),
  mobileRecordFreeTag: {
    position: "absolute",
    top: -21,
    right: -8,
  },
});
