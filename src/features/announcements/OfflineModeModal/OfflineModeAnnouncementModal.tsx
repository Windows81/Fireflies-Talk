import { IconCloudOff } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { useDownloads } from "@/features/downloads";
import {
  OFFLINE_MODE_ANNOUNCEMENT_SEEN_FLAG_KEY,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { useGetCurrentUserQuery } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { isMobile } from "@/utils/device";
import { useEffect, type FC } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * One-time feature announcement for offline mode. Shown once per device;
 * "Turn on" flips the same master switch as the Downloads settings screen.
 */
export const OfflineModeAnnouncementModal: FC<{
  isOpen: boolean;
  open(): void;
  close(): void;
}> = ({ isOpen, open, close }) => {
  const theme = useTheme();
  const autoDownloadEnabled = useDownloads(
    (s) => s.settings.autoDownloadEnabled,
  );
  const updateSettings = useDownloads((s) => s.updateSettings);
  const hasSeenAnnouncement = userLocalUserFlagsStore(
    (s) => !!s.flags[OFFLINE_MODE_ANNOUNCEMENT_SEEN_FLAG_KEY],
  );
  const { data } = useGetCurrentUserQuery();
  const approvedTerms = data?.user?.approvedTerms === true;

  useEffect(() => {
    // auto-download only exists on mobile (mirrors the useAutoDownloadRecent guard)
    if (!isMobile || hasSeenAnnouncement || autoDownloadEnabled) return;
    // yield the announcement slot: the compliance dialog owns the session
    // of users who haven't approved terms yet
    if (!approvedTerms) return;
    open();
  }, [hasSeenAnnouncement, autoDownloadEnabled, approvedTerms, open]);

  // mark seen + track only when actually displayed (open() requests can be
  // swallowed when another announcement already holds the slot)
  useEffect(() => {
    if (!isOpen) return;
    setLocalUserFlag(OFFLINE_MODE_ANNOUNCEMENT_SEEN_FLAG_KEY, true);
    tracker.track(TRACKING_EVENTS.OFFLINE_MODE_ANNOUNCEMENT_VIEWED);
  }, [isOpen]);

  const enableAutoDownload = () => {
    updateSettings({ autoDownloadEnabled: true });
    tracker.track(TRACKING_EVENTS.OFFLINE_MODE_AUTO_DOWNLOAD_ENABLED, {
      from: "announcement_modal",
    });
    close();
  };

  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      <SafeAreaView
        style={styles.root}
        edges={{ top: "off", right: "off", bottom: "maximum", left: "off" }}
      >
        <View style={styles.iconChip(theme)}>
          <IconCloudOff
            color={theme.colors.textBrand}
            width={28}
            height={28}
            strokeWidth={1.75}
          />
        </View>
        <View style={styles.heading}>
          <Text variant="heading4Weight">Your meetings, now offline</Text>
          <Text variant="body1Regular" color="textSecondary">
            Fireflies can now automatically download your recent meetings, so
            you can read and play them even without an internet connection.
          </Text>
        </View>
        <View style={styles.footer}>
          <Button size="lg" onPress={enableAutoDownload}>
            Turn on auto-download
          </Button>
          <Button size="lg" variant="transparentNeutral" onPress={close}>
            Not now
          </Button>
        </View>
      </SafeAreaView>
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    padding: 24,
  },
  iconChip: (theme) => ({
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerMuted,
  }),
  heading: {
    gap: 12,
    marginTop: 24,
  },
  footer: {
    gap: 8,
    marginTop: 40,
  },
});
