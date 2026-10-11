import { type Meeting } from "@/graphql";
import { SpeakerSourceStrip } from "@/features/speaker-source";
import { createStyles, useTheme } from "@/styles";
import { type FC, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { RecordingControls } from "../FloatingControls/RecordingControls";
import { MeetingConsentBanner } from "../components/MeetingConsentBanner";
import {
  LEFT_TAB,
  rtpNotesColumnPadding,
  RTP_NOTES_COLUMN_MAX_WIDTH,
  type LeftTab,
} from "../constants";
import { MeetingHeader } from "./MeetingHeader";
import { MeetingPrepScreenDesktop } from "./MeetingPrepScreenDesktop";
import { MergeToSummaryToggle } from "./MergeToSummaryToggle";
import { NotesTab } from "./NotesTab";
import { LiveAssistTab } from "./LiveAssistTab";
import { NotesNavigationMenu, type NotesView } from "./NotesNavigationMenu";
import { CameraNoticeWarningBanner } from "../../components/CameraNoticeWarningBanner";

interface LeftPanelProps {
  meeting: Meeting;
  leftTab: LeftTab;
  onAskFredPrompt: () => void;
  onNavBackChange?: (handler: (() => void) | undefined) => void;
}

export const LeftPanel: FC<LeftPanelProps> = ({
  meeting,
  leftTab,
  onAskFredPrompt,
  onNavBackChange,
}) => {
  const theme = useTheme();
  const isNotes = leftTab === LEFT_TAB.NOTES;
  const [notesView, setNotesViewState] = useState<NotesView>("my-notes");
  // The notes view we left when opening Meeting Prep, so "back" returns to it.
  const prevNotesViewRef = useRef<NotesView>("my-notes");
  const isMeetingPrep = isNotes && notesView === "meeting-prep";

  const setNotesView = (next: NotesView) => {
    if (next === "meeting-prep" && notesView !== "meeting-prep") {
      prevNotesViewRef.current = notesView;
    }
    setNotesViewState(next);
  };

  useEffect(() => {
    onNavBackChange?.(
      isMeetingPrep
        ? () => setNotesViewState(prevNotesViewRef.current)
        : undefined,
    );
  }, [isMeetingPrep, onNavBackChange]);

  return (
    <View style={styles.panel(theme)}>
      {/* Notes column stays centered while the spy rail hugs the right edge of
          the panel (a sibling, not inside the centered column) so it sits next
          to the AskFred/Transcript pane — matching the notepad layout. */}
      <View style={styles.notesRow}>
        <View
          style={[
            styles.notesArea(theme),
            { paddingHorizontal: rtpNotesColumnPadding(theme.breakpoint) },
          ]}
        >
          <View style={styles.notesColumn}>
            <View style={styles.content} nativeID="rtp-notes-content">
              <MeetingHeader
                meeting={meeting}
                rightAccessory={
                  isNotes && !isMeetingPrep ? (
                    <MergeToSummaryToggle meetingId={meeting.id} />
                  ) : null
                }
              />
              <CameraNoticeWarningBanner />
              {isNotes && !isMeetingPrep && <SpeakerSourceStrip />}
              {isNotes ? (
                isMeetingPrep ? (
                  <MeetingPrepScreenDesktop meeting={meeting} />
                ) : (
                  <NotesTab
                    meeting={meeting}
                    view={notesView}
                    onChangeView={setNotesView}
                  />
                )
              ) : (
                <LiveAssistTab
                  meeting={meeting}
                  onAskFredPrompt={onAskFredPrompt}
                />
              )}
            </View>
          </View>
        </View>
        {isNotes && (
          <NotesNavigationMenu value={notesView} onChange={setNotesView} />
        )}
      </View>
      <View style={styles.controlsWrap} pointerEvents="box-none">
        <RecordingControls meeting={meeting} />
        <MeetingConsentBanner meetingId={meeting.id} />
      </View>
    </View>
  );
};

const styles = createStyles({
  panel: (theme) => ({
    flex: 1,
    minWidth: 0,
    backgroundColor: theme.colors.layerSubtle,
  }),
  // Row that holds the centered notes column plus the right-hugging spy rail.
  notesRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
  },
  // Fills the space left of the rail and centers the notes column within it.
  notesArea: (theme) => ({
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    alignItems: "center",
    backgroundColor: theme.colors.layerSubtle,
  }),
  notesColumn: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: RTP_NOTES_COLUMN_MAX_WIDTH,
  },
  content: {
    flex: 1,
    paddingTop: 16,
    gap: 28,
  },
  controlsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: "center",
    gap: 20,
  },
});
