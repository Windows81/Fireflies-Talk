import { IconArrowLeft, IconMinimize } from "@/assets/svg";
import { Button } from "@/components/Button";
import { HoverTooltip } from "@/components/HoverTooltip";
import { ShareSplitButton } from "@/features/meeting/share-meeting/ShareSplitButton";
import { FeedbackButton } from "@/screens/Feedback";
import { type Meeting } from "@/graphql";
import {
  ASSISTANT_PANE_WIDTH,
  NOTES_VIEW_RAIL_WIDTH,
} from "@/screens/DesktopNotepad/constants";
import { useIsWindowFullscreen } from "@/screens/DesktopNotepad/hooks/useIsWindowFullscreen";
import { createStyles, useTheme } from "@/styles";
import { getWindowChromeLeftInset } from "@/utils/desktopWindowChrome";
import { type FC, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useOptionalLiveScreenContext } from "../../Context/LiveScreenContext";

interface RealtimePanelNavBarProps {
  meeting: Meeting;
  onBack?: () => void;
  onToggleViewMode?: () => void;
  // The Notes/Live Assist tabs, rendered inline in the header centered over the
  // notes column (matching the notepad and the Feedback/Share cluster width).
  center?: ReactNode;
}

export const RealtimePanelNavBar: FC<RealtimePanelNavBarProps> = ({
  meeting,
  onBack,
  onToggleViewMode,
  center,
}) => {
  const theme = useTheme();
  const isFullscreen = useIsWindowFullscreen();
  const paddingLeft = getWindowChromeLeftInset(isFullscreen);

  // Going back only returns to home — it never stops the recording — so the
  // tooltip reassures the user and reflects whether it's currently paused.
  const isRecordingPaused =
    useOptionalLiveScreenContext()?.recordingContext?.state === "paused";
  const backTooltip = onBack
    ? "Back to recording"
    : isRecordingPaused
      ? "Back to home (recording stays paused)"
      : "Back to home (won't stop recording)";
  const handleBack =
    onBack ?? (() => window.electron?.window.closeAndFocusMain());

  return (
    <View nativeID="drag-region" style={[styles.bar(theme), { paddingLeft }]}>
      <View nativeID="no-drag" style={styles.chromeCluster}>
        <HoverTooltip position="bottom" label={backTooltip} tooltipOffset={50}>
          <Pressable
            style={styles.iconButton}
            onPress={handleBack}
            accessibilityLabel={backTooltip}
            aria-label={backTooltip}
          >
            <IconArrowLeft
              width={20}
              height={20}
              color={theme.colors.commandNeutralDefault}
            />
          </Pressable>
        </HoverTooltip>
        <HoverTooltip position="bottom" label="Open realtime panel">
          <Button
            accessibilityLabel="Open realtime panel"
            Icon={IconMinimize}
            iconSize={18}
            onPress={() => onToggleViewMode?.()}
            variant="transparentNeutral"
            size="xs"
          />
        </HoverTooltip>
      </View>
      <View style={styles.center}>
        <View style={styles.centerSlot}>
          <View nativeID="no-drag" style={styles.noDrag}>
            {center}
          </View>
        </View>
        <View style={styles.centerRailSpacer} />
      </View>
      <View style={styles.rightActions}>
        <View nativeID="no-drag" style={styles.rightActionsInner}>
          <FeedbackButton />
          <ShareSplitButton meetingId={meeting.id} />
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  bar: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 2,
    backgroundColor: theme.colors.layerSubtle,
  }),
  chromeCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // Fills the space between the chrome cluster and the Feedback/Share cluster.
  // The rail spacer mirrors the notes body so the tabs center over the notes
  // column rather than the whole header.
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  centerSlot: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Content-sized so only the tabs are no-drag; the space around them stays draggable.
  noDrag: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerRailSpacer: {
    width: NOTES_VIEW_RAIL_WIDTH,
  },
  // Feedback / Share sit above the AskFred/Transcript pane (same width).
  rightActions: {
    width: ASSISTANT_PANE_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  // Content-sized no-drag cluster; the empty space beside it stays draggable.
  rightActionsInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
});
