import { IconCloudOff } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useDownloads } from "@/features/downloads";
import { createStyles, useTheme } from "@/styles";
import { useNetworkState } from "@/utils/network";
import type { FC } from "react";
import { View } from "react-native";

// Only meaningful while offline mode (the auto-download master switch) is on —
// without cached meetings the "content you can play" promise would be empty.
export const useShowOfflineBanner = () => {
  const autoDownloadEnabled = useDownloads(
    (s) => s.settings.autoDownloadEnabled,
  );
  const isOffline = useNetworkState().isInternetReachable === false;
  return autoDownloadEnabled && isOffline;
};

export const OfflineModeBanner: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <View style={styles.iconChip(theme)}>
        <IconCloudOff
          color={theme.colors.informationStaticYellowText}
          width={20}
          height={20}
          strokeWidth={1.75}
        />
      </View>
      <View style={styles.copy}>
        <Text variant="label1Weight" color="informationStaticYellowText">
          You&apos;re offline
        </Text>
        <Text
          variant="label2Regular"
          color="informationStaticYellowText"
          style={styles.description}
        >
          Showing content you can play with no connection.
        </Text>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.informationStaticYellowSubtle,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    width: "100%",
  }),
  iconChip: (theme) => ({
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerDefault,
  }),
  copy: {
    flex: 1,
    gap: 1,
  },
  description: {
    opacity: 0.8,
  },
});
