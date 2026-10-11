import { Separator } from "@/components/Separator";
import { useBilling } from "@/features/billing";
import { UpgradeButton } from "@/screens/You/components";
import { createStyles, useTheme } from "@/styles";
import { getWindowChromeLeftInset } from "@/utils/desktopWindowChrome";
import { type ReactNode } from "react";
import { View } from "react-native";
import { ASSISTANT_PANE_WIDTH, NOTES_VIEW_RAIL_WIDTH } from "../constants";
import { useIsWindowFullscreen } from "../hooks/useIsWindowFullscreen";
import { useNotepadMeetingActions } from "../hooks/useNotepadMeetingActions";
import { ShareSplitButton } from "@/features/meeting/share-meeting/ShareSplitButton";
import { NotepadDownloadButton } from "./DownloadMeeting/NotepadDownloadButton";
import { NotepadBackButton } from "./NotepadBackButton";
import { NotepadMoreMenu } from "./NotepadMoreMenu";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";

// `center` renders the main (Notes/Tasks) tabs inline in the header row,
// centered over the notes column (matching the assistant actions on the right).
export const DesktopNotepadNavBar = ({
  onBack,
  center,
}: {
  onBack?: () => void;
  center?: ReactNode;
}) => {
  const theme = useTheme();
  const { meeting } = useDesktopNotepadContext();
  const isFullscreen = useIsWindowFullscreen();
  const { isFreeUser, reachedFreeMeetingsLimit } = useBilling();
  const { canDownload, canDelete } = useNotepadMeetingActions();

  const paddingLeft = getWindowChromeLeftInset(isFullscreen);

  return (
    <View nativeID="drag-region" style={[styles.bar(theme), { paddingLeft }]}>
      <NotepadBackButton onBack={onBack} />
      <View style={styles.center}>
        <View style={styles.centerSlot}>
          <View nativeID="no-drag" style={styles.noDrag}>
            {center}
          </View>
        </View>
        <View style={styles.centerRailSpacer} />
      </View>
      <View style={styles.assistantActions}>
        <View nativeID="no-drag" style={styles.assistantActionsInner}>
          {isFreeUser && (
            <UpgradeButton
              variant={reachedFreeMeetingsLimit ? "critical" : "positive"}
              source="desktop_notepad_header"
              fullWidth={false}
            />
          )}
          {/* A still-processing meeting you do not own has neither control, and
              an empty group would leave the divider dangling beside Share. */}
          {(canDownload || canDelete) && (
            <>
              <View style={styles.meetingActions}>
                <NotepadDownloadButton />
                <NotepadMoreMenu />
              </View>
              <Separator style={styles.actionsDivider} />
            </>
          )}
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
    paddingVertical: 6,
    backgroundColor: theme.colors.layerSubtle,
  }),
  // Fills the space between the back button and the assistant actions. The
  // rail spacer mirrors the notes body so the tabs center over the notes
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
  // Content-sized so only the tabs are no-drag; empty space around stays draggable.
  noDrag: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerRailSpacer: {
    width: NOTES_VIEW_RAIL_WIDTH,
  },
  // Download / more / Share sit above the assistant pane (same width as the
  // pane). `minWidth` rather than `width` so the cluster grows into the
  // flexible centre instead of overflowing once Upgrade joins the row.
  assistantActions: {
    minWidth: ASSISTANT_PANE_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  // Content-sized no-drag cluster; the empty space beside it stays draggable.
  assistantActionsInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // The meeting-scoped controls sit tighter together than they do to Upgrade.
  meetingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // Vertical hairline separating the meeting actions from the share controls.
  actionsDivider: {
    width: 1,
    height: 16,
  },
});
