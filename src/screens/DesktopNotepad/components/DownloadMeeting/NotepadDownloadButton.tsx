import { IconDownload } from "@/assets/svg";
import { trackPaywallShown } from "@/features/paywall";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import { useState } from "react";
import { Pressable } from "react-native";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { useNotepadMeetingActions } from "../../hooks/useNotepadMeetingActions";
import { DownloadMeetingDialog } from "./DownloadMeetingDialog";
import { DownloadPaywallDialog } from "./DownloadPaywallDialog";

/**
 * Download control in the notepad nav bar, owning the download dialog and the
 * paywall it can hand off to. Renders nothing when the meeting has no
 * downloadable assets.
 */
export const NotepadDownloadButton = () => {
  const theme = useTheme();
  const { meeting } = useDesktopNotepadContext();

  const [isDownloadOpen, openDownload, closeDownload] = useBooleanState(false);
  const [paywallFormat, setPaywallFormat] = useState<string | null>(null);

  const { canDownload } = useNotepadMeetingActions();

  const onPress = () => {
    openDownload();
    tracker.track(TRACKING_EVENTS.DOWNLOAD_MODAL_OPENED, {
      type: "meeting",
      from: "desktop-notepad-nav",
      meetingId: meeting.id,
    });
  };

  // The download dialog swaps itself for the paywall so only one modal is ever
  // mounted, and the prompt can name the format the user selected.
  const onUpgradeRequired = (format: string) => {
    closeDownload();
    setPaywallFormat(format);
    trackPaywallShown({ paywall: "download", from: "desktop-notepad" });
  };

  if (!canDownload) return null;

  return (
    <>
      <Pressable
        style={styles.iconButton}
        onPress={onPress}
        aria-label="Download"
      >
        <IconDownload
          width={20}
          height={20}
          color={theme.colors.commandNeutralDefault}
        />
      </Pressable>

      <DownloadMeetingDialog
        meeting={meeting}
        isOpen={isDownloadOpen}
        close={closeDownload}
        onUpgradeRequired={onUpgradeRequired}
      />

      <DownloadPaywallDialog
        format={paywallFormat}
        close={() => setPaywallFormat(null)}
      />
    </>
  );
};

const styles = createStyles({
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
});
