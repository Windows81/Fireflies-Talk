import { IconLink } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { copyAsText } from "@/utils/clipboard";
import { useBooleanState } from "@/utils/states";
import { type FC } from "react";
import { Pressable, View } from "react-native";
import { ShareMeetingDialog } from "./ShareMeetingDialog";

/**
 * Split button: "Share" opens the share dialog; the link segment copies the
 * meeting's view URL. Used in the notepad nav bar and the live realtime panel.
 */
export const ShareSplitButton: FC<{ meetingId: string }> = ({ meetingId }) => {
  const [isShareOpen, openShare, closeShare] = useBooleanState(false);
  const shareHover = useWebHover();
  const copyHover = useWebHover();

  const copyMeetingLink = () => {
    copyAsText(`${Config.DASHBOARD_URL}/view/${meetingId}`)
      .then(() => toast({ message: "Meeting link copied" }))
      .catch(() => toast({ message: "Failed to copy link" }));
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.leading,
          shareHover.isHovered && styles.segmentHover,
          pressed && styles.segmentPressed,
        ]}
        onPress={openShare}
        aria-label="Share"
        {...shareHover.webHoverProps}
      >
        <Text
          variant="label2Weight"
          color="commandPrimaryDefault"
          style={styles.shareText}
        >
          Share
        </Text>
      </Pressable>
      <View style={styles.divider} />
      <Pressable
        style={({ pressed }) => [
          styles.iconPart,
          copyHover.isHovered && styles.segmentHover,
          pressed && styles.segmentPressed,
        ]}
        onPress={copyMeetingLink}
        aria-label="Copy meeting link"
        {...copyHover.webHoverProps}
      >
        <IconLink width={20} height={20} color={DESKTOP_THEME.purple400} />
      </Pressable>
      <ShareMeetingDialog
        meetingId={meetingId}
        isOpen={isShareOpen}
        close={closeShare}
      />
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 32,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: DESKTOP_THEME.purple1100,
  },
  leading: {
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  divider: {
    width: 1,
    backgroundColor: DESKTOP_THEME.purple1000,
  },
  iconPart: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  segmentHover: {
    backgroundColor: DESKTOP_THEME.purple1000,
  },
  segmentPressed: {
    backgroundColor: DESKTOP_THEME.purple900,
  },
  shareText: {
    color: DESKTOP_THEME.purple400,
  },
});
