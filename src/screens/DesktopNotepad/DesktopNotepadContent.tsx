import { AskFredThreadProvider } from "@/features/ask-fred";
import { TrialBanner } from "@/features/free-trial";
import { PlayerProvider } from "@/features/player";
import { ThemeContext, desktopUiTheme, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { View } from "react-native";
import { DesktopNotepadAssistantPane } from "./components/DesktopNotepadAssistantPane";
import { DesktopNotepadNavBar } from "./components/DesktopNotepadNavBar";
import { NotepadBottomBar } from "./components/NotepadBottomBar";
import { NotepadMyNotes } from "./components/NotepadMyNotes/NotepadMyNotes";
import { NotepadSummary } from "./components/NotepadSummary/NotepadSummary";
import { NotepadTasks } from "./components/NotepadTasks/NotepadTasks";
import { NotesViewNav } from "./components/NotesViewNav";
import { StoragePaywall } from "./components/StoragePaywall/StoragePaywall";
import {
  DEFAULT_ASSISTANT_TAB,
  DEFAULT_MAIN_TAB,
  MAIN_TABS,
} from "./constants";
import {
  DesktopNotepadContext,
  useDesktopNotepadContext,
} from "./DesktopNotepadContext";
import { useNotepadManualNotes } from "./hooks/useNotepadManualNotes";
import { useSummaryProcessingStore } from "./hooks/useSummaryProcessingStore";
import {
  NotepadTasksProvider,
  useNotepadTasksContext,
} from "./NotepadTasksProvider";
import { SegmentTabs } from "./shared/SegmentTabs";
import { hiddenPaneStyle, layoutStyles } from "./styles";
import type {
  AssistantTab,
  DesktopNotepadMeeting,
  MainTab,
  NotesView,
  TranscriptSeekRequest,
} from "./types";

const MainPaneTabs = () => {
  const { meeting, mainTab, setMainTab } = useDesktopNotepadContext();
  const { totalCount } = useNotepadTasksContext();

  const tabs = useMemo(
    () =>
      MAIN_TABS.map((tab) =>
        tab.key === "tasks" ? { ...tab, badge: totalCount || undefined } : tab,
      ),
    [totalCount],
  );

  const handleChange = useCallback(
    (next: MainTab) => {
      if (next !== mainTab && next === "tasks") {
        tracker.track(TRACKING_EVENTS.NOTEPAD_TAB_CLICKED, {
          meetingId: meeting.id,
          tab: "tasks",
        });
      }
      setMainTab(next);
    },
    [mainTab, setMainTab, meeting.id],
  );

  return <SegmentTabs tabs={tabs} value={mainTab} onChange={handleChange} />;
};

export const DesktopNotepadContent: FC<{
  meeting: DesktopNotepadMeeting;
  fromRecording: boolean;
  // Overrides the nav bar's default back behavior. Set when the notepad is
  // rendered in place inside the Live window (no navigation stack).
  onBack?: () => void;
  // How the notepad was reached: "direct" (opened from a meeting) or "rtp"
  // (the realtime panel transformed into the notepad when recording ended).
  visitSource?: "direct" | "rtp";
}> = ({ meeting, fromRecording, onBack, visitSource = "direct" }) => {
  const { breakpoint } = useTheme();
  const theme = useMemo(
    () => ({ ...desktopUiTheme, breakpoint }),
    [breakpoint],
  );
  const [mainTab, setMainTab] = useState<MainTab>(DEFAULT_MAIN_TAB);
  const [assistantTab, setAssistantTab] = useState<AssistantTab>(
    DEFAULT_ASSISTANT_TAB,
  );
  const [notesView, setNotesView] = useState<NotesView>("ai");
  const [transcriptSeek, setTranscriptSeek] =
    useState<TranscriptSeekRequest | null>(null);

  const seekNonceRef = useRef(0);
  const requestTranscriptSeek = useCallback((seconds: number) => {
    setAssistantTab("transcript");
    setTranscriptSeek({ seconds, nonce: ++seekNonceRef.current });
  }, []);
  const [paneScrollY, setPaneScrollY] = useState(0);

  const { notes: manualNotes } = useNotepadManualNotes(meeting.id);

  // Reset summary processing and stale seek requests when switching meetings.
  useEffect(() => {
    setTranscriptSeek(null);
    return () => useSummaryProcessingStore.getState().clearMeeting(meeting.id);
  }, [meeting.id]);

  const visitedMeetingIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (visitedMeetingIdRef.current === meeting.id) return;
    visitedMeetingIdRef.current = meeting.id;
    tracker.track(TRACKING_EVENTS.NOTEPAD_VISITED, {
      meetingId: meeting.id,
      source: visitSource,
    });
  }, [meeting.id, visitSource]);
  const hasManualNotes = manualNotes != null;
  // Manual notes may be absent; fall back to the AI summary in that case.
  const activeNotesView: NotesView = hasManualNotes ? notesView : "ai";
  const showNotesViewRail = mainTab === "notes" && hasManualNotes;
  const showAiNotes = mainTab === "notes" && activeNotesView === "ai";
  const showMyNotes = mainTab === "notes" && activeNotesView === "my";
  const showTasks = mainTab === "tasks";

  return (
    <ThemeContext.Provider value={theme}>
      <PlayerProvider>
        <AskFredThreadProvider meetingId={meeting.id}>
          <DesktopNotepadContext.Provider
            value={{
              meeting,
              fromRecording,
              mainTab,
              setMainTab,
              assistantTab,
              setAssistantTab,
              notesView,
              activeNotesView,
              setNotesView,
              transcriptSeek,
              requestTranscriptSeek,
              paneScrollY,
              setPaneScrollY,
            }}
          >
            <NotepadTasksProvider meetingId={meeting.id}>
              <View style={layoutStyles.root(theme)}>
                <DesktopNotepadNavBar
                  onBack={onBack}
                  center={<MainPaneTabs />}
                />
                <TrialBanner />
                <View style={layoutStyles.body}>
                  <View style={layoutStyles.mainPane}>
                    <View style={layoutStyles.mainPaneContent}>
                      <View style={layoutStyles.notesArea(theme)}>
                        <View style={layoutStyles.notesColumn}>
                          <View style={hiddenPaneStyle(showAiNotes)}>
                            <NotepadSummary />
                          </View>
                          <View style={hiddenPaneStyle(showMyNotes)}>
                            <NotepadMyNotes />
                          </View>
                          <View style={hiddenPaneStyle(showTasks)}>
                            <NotepadTasks />
                          </View>
                        </View>
                        <View
                          style={layoutStyles.toolbarAnchor}
                          pointerEvents="box-none"
                        >
                          <NotepadBottomBar />
                        </View>
                      </View>
                    </View>
                    <NotesViewNav
                      value={activeNotesView}
                      showNotesViewRail={showNotesViewRail}
                      onChange={setNotesView}
                    />
                  </View>
                  <DesktopNotepadAssistantPane />
                </View>
                {/* Last child so it covers the nav bar too — the notepad is
                    fully blocked while the team is out of storage. */}
                <StoragePaywall onBack={onBack} />
              </View>
            </NotepadTasksProvider>
          </DesktopNotepadContext.Provider>
        </AskFredThreadProvider>
      </PlayerProvider>
    </ThemeContext.Provider>
  );
};
