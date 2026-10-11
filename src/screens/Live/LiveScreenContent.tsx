import { KeyboardAvoidingView } from "@/components/Layout";
import { LoadingScreen } from "@/components/Loading";
import { type Meeting } from "@/graphql";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { useEffect, useRef, type FC } from "react";
import { Platform, View } from "react-native";
import { isLiveMeeting } from "@/features/live";
import {
  AskFredButton,
  LiveAssistModal,
  LiveAssistContent,
  useAssistThread,
} from "@/features/ask-fred";
import { PostMeetingPanel } from "./components/PostMeetingPanel";
import { isDesktop } from "@/utils/device";
import { useIsDesktopNotepadEnabled } from "@/screens/DesktopNotepad/hooks/useIsDesktopNotepadEnabled";
import { PostMeetingNotepad } from "./RealtimePanel/PostMeetingNotepad";
import { useOptionalLiveScreenContext } from "./Context/LiveScreenContext";
import { useMeetingEndAnimationStore } from "@/features/meeting-end-animation";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-native-resizable-panels";
import { RealtimePanelView } from "./RealtimePanel/RealtimePanelView";

/**
 * Desktop live screen body (mobile/web render the unified recording screen
 * from LiveScreen instead): the realtime panel while the meeting is live,
 * then the notepad or the post-meeting panel once it ends.
 */
export const LiveScreenContent: FC<{
  meeting: Meeting | null;
  onToggleViewMode?: () => void;
}> = ({ meeting, onToggleViewMode }) => {
  const theme = useTheme();
  const liveScreenContext = useOptionalLiveScreenContext();
  const isNotepadEnabled = useIsDesktopNotepadEnabled();
  const isAnimationShowing = useMeetingEndAnimationStore(
    (state) => state.isShowing,
  );

  const { isAssistPanelOpen, setAssistPanelOpen } = useAssistThread();

  const hasAutoOpenedRef = useRef<boolean>(false);

  const isMeetingEnded =
    liveScreenContext?.isMeetingEnded ??
    (meeting ? !isLiveMeeting(meeting) : false);

  // Don't show post-meeting panel while animation is playing
  const shouldShowPostMeetingPanel =
    isMeetingEnded && !isAnimationShowing && meeting;

  const isWideScreen = theme.breakpoint >= Breakpoint.Medium;

  // Auto-open AskFred when meeting ends (only once), only on wide screens
  // On narrow screens AskFred opens as a modal which is awkward by default
  useEffect(() => {
    if (
      isWideScreen &&
      isMeetingEnded &&
      !isAnimationShowing &&
      !isAssistPanelOpen &&
      !hasAutoOpenedRef.current
    ) {
      setAssistPanelOpen(true);
      hasAutoOpenedRef.current = true;
    }
    if (!isMeetingEnded) {
      hasAutoOpenedRef.current = false;
    }
  }, [
    isWideScreen,
    isMeetingEnded,
    isAnimationShowing,
    isAssistPanelOpen,
    setAssistPanelOpen,
  ]);

  // Hide Live screen content while animation window is showing
  if (isAnimationShowing) {
    return <View style={styles.root(theme)} />;
  }

  // When a recording ends, swap the realtime panel for the notepad in place on
  // the same route. This applies whether the live view rendered in the dedicated
  // live window (legacy floating flow) or in the main window (one-window model) —
  // notepad-enabled users always land on the full notepad, not the instant summary.
  if (isDesktop && meeting && isMeetingEnded && isNotepadEnabled) {
    return <PostMeetingNotepad meetingId={meeting.id} />;
  }

  if (isDesktop && meeting && !isMeetingEnded) {
    return (
      <RealtimePanelView
        meeting={meeting}
        onToggleViewMode={onToggleViewMode}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root(theme)}>
      <View
        style={[styles.container, isWideScreen && styles.wideScreenContainer]}
      >
        <PanelGroup direction="horizontal">
          <Panel defaultSize={60} minSize={40}>
            {shouldShowPostMeetingPanel ? (
              <View
                style={[
                  styles.tabsContainer,
                  isWideScreen && styles.wideScreenTabs(theme),
                ]}
              >
                <PostMeetingPanel meeting={meeting!} />
                {!isWideScreen && !isAssistPanelOpen && (
                  <View style={[styles.fabContainer, { bottom: 20 }]}>
                    <AskFredButton onPress={() => setAssistPanelOpen(true)} />
                  </View>
                )}
              </View>
            ) : (
              // Only reachable while the meeting query is still loading.
              <LoadingScreen />
            )}
          </Panel>

          {meeting && isWideScreen && (
            <>
              <PanelResizeHandle style={styles.panelResizeHandle} />
              <Panel defaultSize={40} minSize={30}>
                <View style={styles.assistPanel}>
                  <LiveAssistContent
                    meeting={meeting}
                    isDemo={liveScreenContext?.recordingContext?.isDemo}
                  />
                </View>
              </Panel>
            </>
          )}
        </PanelGroup>
      </View>
      {meeting && !isWideScreen && (
        <LiveAssistModal
          meeting={meeting}
          isOpen={isAssistPanelOpen}
          close={() => setAssistPanelOpen(false)}
          isDemo={liveScreenContext?.recordingContext?.isDemo}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.textContrast,
  }),
  container: {
    flex: 1,
  },
  wideScreenContainer: {
    flexDirection: "row",
  },
  tabsContainer: {
    flex: 1,
  },
  wideScreenTabs: (theme) => ({
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderStaticDefault,
  }),
  assistPanel: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    right: 15,
    zIndex: 1000,
  },
  panelResizeHandle: {
    width: 5,
    height: "100%",
    cursor: Platform.OS === "web" ? ("ew-resize" as any) : "auto",
  },
});
