import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useDownloads } from "@/features/downloads";
import { useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";

// Prompt shown while auto-download is off; flips the same master switch as the
// Downloads settings screen, then fades itself out.
export const EnableAutoDownloadCard: FC = () => {
  const theme = useTheme();
  const autoDownloadEnabled = useDownloads(
    (s) => s.settings.autoDownloadEnabled,
  );
  const updateSettings = useDownloads((s) => s.updateSettings);

  if (autoDownloadEnabled) return null;

  const enable = () => {
    updateSettings({ autoDownloadEnabled: true });
    tracker.track(TRACKING_EVENTS.OFFLINE_MODE_AUTO_DOWNLOAD_ENABLED, {
      from: "downloads_screen",
    });
    toast({
      type: "success",
      message: "Your recent meetings will download automatically",
    });
  };

  return (
    <Animated.View
      exiting={FadeOut.duration(250)}
      style={[styles.card, { backgroundColor: theme.colors.layerSubtle }]}
    >
      <View style={styles.detail}>
        <Text variant="label1Weight" color="textPrimary">
          Auto-download recent meetings
        </Text>
        <Text variant="label2Regular" color="textMuted">
          Keep your latest meetings available offline
        </Text>
      </View>
      <Switch
        value={false}
        onValueChange={enable}
        aria-label="Auto-download recent meetings"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    padding: 16,
  },
  detail: {
    flex: 1,
    gap: 2,
  },
});
