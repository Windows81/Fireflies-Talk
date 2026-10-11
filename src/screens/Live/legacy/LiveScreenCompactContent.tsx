import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { GetMeetingPrepDocument } from "@firefliesai/mobile-ff.graphql-client";
import { useQuery } from "@apollo/client";
import { createStyles, useTheme, vars } from "@/styles";
import { useRef, useState, useEffect, type FC } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LiveAssistSection } from "../Notes/LiveAssistSection";
import {
  LiveAssistContent,
  LiveAssistInput,
  LiveAssistSidePanelHeader,
  useAssistThread,
} from "@/features/ask-fred";
import { DesktopHeaderCompact } from "./DesktopHeaderCompact";
import {
  CompactNotesTranscript,
  type CompactPaneTab,
} from "../components/CompactNotesTranscript";
import { Dock } from "../components/Dock";
import {
  RecurringMeetingSummaryButton,
  useRecurringSummaryVisibilityWindow,
} from "../components/RecurringMeetingSummaryButton";
import { TranscriptSearchProvider } from "../Context/TranscriptSearchContext";
import { CopyAndSearchAction } from "../components/CopyAndSearchAction";
import { useGlassSync } from "@/hooks/useGlassSync";
import { Toaster, toast } from "@/components/Toast";
import { AssistModeSelector } from "../Notes/AssistModeSelector";
import { DesktopBottomGradient } from "../components/DesktopBottomGradient";
import { DragHandlerOverlay } from "../components/DragHandlerOverlay";
import { Logger } from "@/logger";
import {
  useCameraNoticeBannerDismissed,
  useCameraRecordingPolicy,
} from "@/features/live-record";
import { useAuth } from "@/features/auth";
import { useOptionalLiveScreenContext } from "../Context/LiveScreenContext";
import { StopRecordingConfirm } from "../RealtimePanel/FloatingControls/StopRecordingConfirm";
import {
  isLongRecordingSeconds,
  useElapsedSecondsGetter,
} from "../RealtimePanel/hooks/useElapsedTimer";
import { getMeetingStartedAt } from "@/features/meeting";
import { useBilling } from "@/features/billing";
import { useMutation } from "@apollo/client";
import {
  UpdateMeetingDocument,
  type MeetingNotesPrivacy,
} from "@firefliesai/mobile-ff.graphql-client";
import { getMeetingPrivacyOption } from "@/constants";
import { useMeetingEndAnimationStore } from "@/features/meeting-end-animation";
import { SpeakerInsightNudge } from "../components/SpeakerInsightNudge";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { CompactCardResizeHandle } from "./CompactCardResizeHandle";
import {
  CAMERA_NOTICE_RADIUS,
  CameraNoticeWarningBanner,
} from "../components/CameraNoticeWarningBanner";
import { useCompactPanelResize } from "../hooks/useCompactPanelResize";
import {
  DEFAULT_PANEL_WIDTH,
  DEFAULT_PANEL_HEIGHT,
  MAX_PANEL_WIDTH,
  PAYWALL_PANEL_HEIGHT,
  type ResizablePanelKind,
} from "@/features/live/compactPanelSize.store";
import { useIsLiveAssistPaywalled } from "@/components/Paywall";
import { ASSIST_MODES } from "@/features/live/types";

const logger = new Logger("LiveScreenCompactContent");

// Panel dimensions
const PANEL_CORNER_RADIUS = window.electron?.platform === "win32" ? 10 : 16;
const PANEL_GAP = 12;

// Height offsets preserved from the original fixed layout so the default look is
// unchanged: the Ask Fred sticky-input card sits 10px below the content height,
// and the Notes/Transcript card 60px below. They scale with the user's height.
const STICKY_INPUT_HEIGHT_OFFSET = 10;
const NOTES_HEIGHT_OFFSET = 60;

// Header dimensions
const HEADER_HEIGHT = 48;

// Layout spacing
const SIDE_PADDING = 32; // 16px on each side
const CONTENT_TOP_MARGIN = 12;

// Dock (floating bar below panels)
const DOCK_MARGIN_TOP = 12;
const DOCK_BAR_HEIGHT = 40; // padding + content height
const DOCK_TOTAL_HEIGHT = DOCK_MARGIN_TOP + DOCK_BAR_HEIGHT;

// Window content width always reserves the left (Live Assist) slot plus the
// current right-panel width, so toggling Live Assist on/off never shifts the
// right card horizontally. The Live Assist card is fixed at the default size;
// only the right card (Notes / Ask Fred) is user-resizable.
const contentWidthFor = (rightPanelWidth: number) =>
  DEFAULT_PANEL_WIDTH + rightPanelWidth + PANEL_GAP + SIDE_PADDING;

export const LiveScreenCompactContent: FC<{
  meeting: Meeting | null;
  onToggleViewMode?: () => void;
}> = ({ meeting, onToggleViewMode }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const liveScreenContext = useOptionalLiveScreenContext();
  const isAnimationShowing = useMeetingEndAnimationStore(
    (state) => state.isShowing,
  );
  const { isAssistPanelOpen, setAssistPanelOpen } = useAssistThread();
  const { isAllowedToUsePrompts, loading: loadingBilling } = useBilling();

  const { defaultShowLiveAssist, defaultShowNotes, isDemo } =
    liveScreenContext?.recordingContext ?? {};

  // Match the same paywall logic as LiveAssistChat — suppressed for demo recordings
  const shouldShowPaywall =
    !isDemo && !isAllowedToUsePrompts && !loadingBilling;

  // The Live Assist slot swaps its feed for a taller paywall, which the window
  // has to make room for. Shares LiveAssistSection's gate so the two agree.
  const isLiveAssistPaywalled = useIsLiveAssistPaywalled({
    assistMode: liveScreenContext?.assistMode ?? ASSIST_MODES.GENERAL,
    isDemo,
    showSalesAssistPaywall: liveScreenContext?.showSalesAssistPaywall,
  });

  const [showLiveAssist, setShowLiveAssist] = useState<boolean | null>(null);
  const [showNotes, setShowNotes] = useState<boolean | null>(null);
  const appliedContextDefaultsRef = useRef(false);

  // Apply default tab state from recording context (e.g. from FirstTimeAfterOnboardingDemo startRecording).
  // Panels stay hidden (null) until the IPC snapshot loads so demo defaults don't flicker.
  useEffect(() => {
    if (appliedContextDefaultsRef.current) return;
    if (!liveScreenContext) {
      appliedContextDefaultsRef.current = true;
      setShowLiveAssist(false);
      setShowNotes(true);
      return;
    }
    // undefined = IPC hasn't responded yet; null = loaded, no active recording
    if (liveScreenContext.recordingContext === undefined) return;
    appliedContextDefaultsRef.current = true;
    setShowLiveAssist(defaultShowLiveAssist ?? false);
    setShowNotes(defaultShowNotes ?? true);
  }, [liveScreenContext, defaultShowLiveAssist, defaultShowNotes]);

  // Shared pause state from context — keeps compact and full views in sync
  const isPausedLocally =
    liveScreenContext?.puppetPauseState?.isPaused ?? false;
  const togglePause = liveScreenContext?.puppetPauseState?.togglePause;

  const getElapsedSeconds = useElapsedSecondsGetter(
    getMeetingStartedAt(meeting),
    isPausedLocally,
  );

  const [isMinimized, setIsMinimized] = useState(false);

  // Measured rather than assumed: the window sizes itself to its content, and a
  // banner whose height was hardcoded would be clipped the moment its wording
  // wrapped to another line. Zero whenever the banner renders nothing.
  const [cameraNoticeHeight, setCameraNoticeHeight] = useState(0);
  const cameraPolicy = useCameraRecordingPolicy();
  const cameraBannerDismissed = useCameraNoticeBannerDismissed();

  // Notes and Ask Fred each have an independently-resizable card size; the right
  // card shows whichever is active. The left Live Assist card stays at default.
  const rightPanelKind: ResizablePanelKind = isAssistPanelOpen
    ? "askFred"
    : "notes";
  const {
    rightSize,
    isResizing,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
  } = useCompactPanelResize(rightPanelKind);

  // Ask Fred's paywall is a fixed-height card rather than a scrolling thread, so
  // a panel the user had shrunk for chatting would clip its CTA. Hold the card
  // at its default height for as long as the paywall stands in for the thread.
  const rightPanelHeight =
    isAssistPanelOpen && shouldShowPaywall
      ? Math.max(rightSize.height, DEFAULT_PANEL_HEIGHT)
      : rightSize.height;

  // While actively dragging, hold the window width at its maximum so the window
  // never re-centers (which would drag the centered top bar side to side and
  // flicker). The card grows inside the fixed-width window; on release the
  // window settles to the final width with the content still centered.
  const liveContentWidth = isResizing
    ? contentWidthFor(MAX_PANEL_WIDTH)
    : contentWidthFor(rightSize.width);

  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [activeContent, setActiveContent] =
    useState<CompactPaneTab>("transcript");
  const [isKnowledgebaseSelectorOpen, setIsKnowledgebaseSelectorOpen] =
    useState(false);
  const prevPanelStateRef = useRef({ live: true, fred: true, notes: false });
  const prevKnowledgebasePanelStateRef = useRef({ fred: false, notes: false });
  const isHost = Boolean(
    user && meeting && meeting.organizerEmail === user.email,
  );

  // Get current privacy from recording context if available, otherwise from meeting
  const currentPrivacy =
    liveScreenContext?.recordingContext?.notesPrivacy || meeting?.notesPrivacy;

  const [updateMeetingMutation] = useMutation(UpdateMeetingDocument, {
    onError(err) {
      toast({
        title: "Could not update meeting privacy",
        message: err.message,
        type: "error",
      });
    },
    onCompleted() {
      const privacyOption = getMeetingPrivacyOption(currentPrivacy);
      toast(`Meeting privacy set to ${privacyOption.label}`);
    },
  });

  const handleChangePrivacy = (privacy: MeetingNotesPrivacy) => {
    if (!meeting?.id || privacy === currentPrivacy) return;

    // Update via GraphQL mutation
    updateMeetingMutation({
      variables: {
        id: meeting.id,
        notesPrivacy: privacy,
      },
    });

    // Update recording context if available
    if (window.electron?.recordingContext) {
      window.electron.recordingContext.requestUpdate({
        meetingId: meeting.id,
        notesPrivacy: privacy,
      });
    }
  };

  const { data: meetingPrepData } = useQuery(GetMeetingPrepDocument, {
    variables: { meetingId: meeting?.id ?? "" },
    skip: !meeting?.id,
  });
  const lastMeeting = meetingPrepData?.getMeetingPrep?.lastMeeting;
  const lastMeetingId = lastMeeting?.id ?? null;
  const isRecurringMeeting = Boolean(lastMeetingId);

  const [screenOpenedAt] = useState(() => new Date());
  const isInRecurringSummaryWindow = useRecurringSummaryVisibilityWindow(
    screenOpenedAt,
    meeting?.id,
  );

  // Glass underlay refs for each panel
  const liveAssistGlassRef = useGlassSync(
    "liveAssist",
    !!showLiveAssist && !isMinimized && !isAnimationShowing,
    PANEL_CORNER_RADIUS,
  );
  const rightPanelGlassRef = useGlassSync(
    "rightPanel",
    (isAssistPanelOpen || !!showNotes) && !isMinimized && !isAnimationShowing,
    PANEL_CORNER_RADIUS,
  );
  const stopDialogGlassRef = useGlassSync(
    "stopDialog",
    isStopDialogOpen && !isAnimationShowing,
    16,
  );
  // Not gated on isMinimized: collapsing the pill asks for less chrome, not for
  // hiding who can see the recording notice.
  const cameraNoticeGlassRef = useGlassSync(
    "cameraNotice",
    cameraPolicy.noticeMissing && !cameraBannerDismissed && !isAnimationShowing,
    CAMERA_NOTICE_RADIUS,
  );

  // Short recordings ask before saving; longer ones (> 5 min) save directly,
  // matching the floating RecordingControls pill's behavior.
  const handleStopClick = () => {
    if (liveScreenContext?.isEndingMeeting) return;
    if (isLongRecordingSeconds(getElapsedSeconds())) {
      handleStopRecording();
      return;
    }
    resetKnowledgebaseSelectorIfOpen();
    // Store current panel states before hiding
    prevPanelStateRef.current = {
      live: !!showLiveAssist,
      fred: isAssistPanelOpen,
      notes: !!showNotes,
    };
    // Hide all panels
    setShowLiveAssist(false);
    setAssistPanelOpen(false);
    setShowNotes(false);
    setIsStopDialogOpen(true);
  };

  const handlePauseClick = () => {
    if (!togglePause) return;
    togglePause();
  };

  const handleContinueRecording = () => {
    setIsStopDialogOpen(false);
    // Restore previous panel states
    const prev = prevPanelStateRef.current;
    setShowLiveAssist(prev.live ?? true);
    setAssistPanelOpen(prev.fred ?? true);
    setShowNotes(prev.notes ?? false);
  };

  const handleStopRecording = async () => {
    if (!meeting?.id || !liveScreenContext?.endLiveMeeting) {
      return;
    }

    tracker.track(TRACKING_EVENTS.AUDIO_RECORD_STOPPED, {
      meetingId: meeting.id,
      source: "floating_pane",
    });

    try {
      await liveScreenContext.endLiveMeeting();
      // Dialog will be hidden by animation (early return at line 342-344)
      // When animation completes, switchToFullView() unmounts compact content
    } catch (error) {
      // Only close dialog if error occurs
      setIsStopDialogOpen(false);
      toast({
        title: "Failed to end the meeting",
        message:
          error instanceof Error ? error.message : "Something went wrong",
        type: "error",
      });
    }
  };

  // Discard from the floating pill mirrors the full-screen confirm: stop the
  // recorder without saving, delete the meeting, and close back to home.
  // discardLiveMeeting closes this window itself, so we keep the confirm dialog
  // up until then — closing it here would briefly reveal the empty compact
  // window, since the panels were hidden when the dialog opened and aren't
  // restored on discard.
  const handleDeleteRecording = () => {
    if (!meeting?.id || !liveScreenContext?.discardLiveMeeting) return;
    liveScreenContext.discardLiveMeeting();
  };

  const handleToggleKnowledgebaseSelector = (isOpen: boolean) => {
    if (isOpen) {
      // Store current panel states before hiding
      prevKnowledgebasePanelStateRef.current = {
        fred: isAssistPanelOpen,
        notes: !!showNotes,
      };
      // Hide other panels
      setAssistPanelOpen(false);
      setShowNotes(false);
    } else {
      // Restore previous panel states
      const prev = prevKnowledgebasePanelStateRef.current;
      setAssistPanelOpen(prev.fred);
      setShowNotes(prev.notes);
    }
    setIsKnowledgebaseSelectorOpen(isOpen);
  };

  // Close stop dialog when animation starts
  useEffect(() => {
    if (isAnimationShowing && isStopDialogOpen) {
      setIsStopDialogOpen(false);
    }
  }, [isAnimationShowing, isStopDialogOpen]);
  // Reset knowledgebase selector state and restore panels that were hidden when it opened
  const resetKnowledgebaseSelectorIfOpen = () => {
    if (isKnowledgebaseSelectorOpen) {
      setIsKnowledgebaseSelectorOpen(false);
      const prev = prevKnowledgebasePanelStateRef.current;
      setAssistPanelOpen(prev.fred);
      setShowNotes(prev.notes);
    }
  };

  // Dynamically resize window based on panel visibility.
  // Width is fixed at 2-panel size so panel toggles only change height.
  useEffect(() => {
    if (typeof window === "undefined" || !window.electron) return;

    // Don't resize window while animation is showing
    if (isAnimationShowing) return;

    try {
      // Window fits the tallest visible card; the left Live Assist slot stays at
      // the default size while the right card uses its own (Notes/Ask Fred) size.
      // Vertical changes are flicker-free because the window is top-anchored.
      const rightPanelVisible = isAssistPanelOpen || !!showNotes;
      let panelBlockHeight = 0;
      if (showLiveAssist)
        panelBlockHeight = isLiveAssistPaywalled
          ? PAYWALL_PANEL_HEIGHT
          : DEFAULT_PANEL_HEIGHT;
      if (rightPanelVisible)
        panelBlockHeight = Math.max(panelBlockHeight, rightPanelHeight);

      const dockRowCount =
        (isRecurringMeeting && isInRecurringSummaryWindow ? 1 : 0) +
        (liveScreenContext?.activeSpeakerInsights?.length ?? 0);
      const contentHeight =
        HEADER_HEIGHT +
        (panelBlockHeight > 0 ? panelBlockHeight + CONTENT_TOP_MARGIN : 0) +
        (dockRowCount > 0 ? DOCK_TOTAL_HEIGHT * dockRowCount : 0) +
        cameraNoticeHeight;

      window.electron.window.resizeToContent(liveContentWidth, contentHeight);
    } catch (error) {
      logger.error("Failed to resize window:", {
        error,
        state: {
          showLiveAssist,
          isAssistPanelOpen,
          showNotes,
          isMinimized,
        },
      });
    }
  }, [
    showLiveAssist,
    isAssistPanelOpen,
    showNotes,
    isMinimized,
    isAnimationShowing,
    meetingPrepData,
    isInRecurringSummaryWindow,
    liveScreenContext?.activeSpeakerInsights,
    isRecurringMeeting,
    liveContentWidth,
    rightPanelHeight,
    cameraNoticeHeight,
    isLiveAssistPaywalled,
  ]);

  const anyWindowOpen =
    !!showLiveAssist ||
    isAssistPanelOpen ||
    !!showNotes ||
    isStopDialogOpen ||
    isKnowledgebaseSelectorOpen ||
    (isRecurringMeeting && isInRecurringSummaryWindow) ||
    (liveScreenContext?.activeSpeakerInsights?.length ?? 0) > 0;

  // Hide Live screen content while animation window is showing
  if (isAnimationShowing) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <DesktopHeaderCompact
        onToggleViewMode={onToggleViewMode}
        anyWindowOpen={anyWindowOpen}
        activeLiveAssist={!!showLiveAssist}
        activeAskFred={isAssistPanelOpen}
        activeNotes={!isAssistPanelOpen && !!showNotes}
        showStopPauseButton={isHost}
        meetingPrivacy={currentPrivacy}
        onChangePrivacy={handleChangePrivacy}
        isHost={isHost}
        recordingState={isPausedLocally ? "paused" : "recording"}
        onToggleLiveAssist={() => {
          try {
            const nextShowLiveAssist = !showLiveAssist;
            if (!nextShowLiveAssist) {
              resetKnowledgebaseSelectorIfOpen();
            }
            setShowLiveAssist(nextShowLiveAssist);
            setIsMinimized(false);
          } catch (error) {
            logger.error("Failed to toggle LiveAssist:", { error });
          }
        }}
        onToggleAskFred={() => {
          try {
            const newState = !isAssistPanelOpen;
            setAssistPanelOpen(newState);
            // Hide notes when AskFred is shown
            if (newState) {
              setShowNotes(false);
            }
            setIsMinimized(false);
          } catch (error) {
            logger.error("Failed to toggle AskFred:", { error });
          }
        }}
        onToggleNotes={() => {
          try {
            const newState = !showNotes;
            setShowNotes(newState);
            // Hide AskFred when Notes are shown
            if (newState) {
              setAssistPanelOpen(false);
            }
            setIsMinimized(false);
          } catch (error) {
            logger.error("Failed to toggle Notes:", { error });
          }
        }}
        onStopClick={handleStopClick}
        onPauseClick={handlePauseClick}
        minimized={isMinimized}
        onToggleMinimized={() => {
          setIsMinimized((m) => {
            const next = !m;
            if (next) {
              resetKnowledgebaseSelectorIfOpen();
              // entering minimized: store and hide
              prevPanelStateRef.current = {
                live: !!showLiveAssist,
                fred: isAssistPanelOpen,
                notes: !!showNotes,
              };
              setShowLiveAssist(false);
              setAssistPanelOpen(false);
              setShowNotes(false);
              // do not move window anymore; UI animates in RN only
            } else {
              // leaving minimized: restore defaults (or previous)
              const prev = prevPanelStateRef.current;
              setShowLiveAssist(prev.live ?? true);
              setAssistPanelOpen(prev.fred ?? true);
              setShowNotes(prev.notes ?? false);
            }
            return next;
          });
        }}
        meetingStartTime={getMeetingStartedAt(meeting)}
      />
      {/* Outside the `!isMinimized` block on purpose: collapsing the pill asks
          for less chrome, not for hiding who can see the recording notice. */}
      <View
        style={styles.cameraNotice}
        onLayout={(event) =>
          setCameraNoticeHeight(event.nativeEvent.layout.height)
        }
      >
        <CameraNoticeWarningBanner glassRef={cameraNoticeGlassRef} />
      </View>
      {!isMinimized && (
        <View
          style={[
            styles.panelsContainer,
            { width: liveContentWidth },
            isKnowledgebaseSelectorOpen && { paddingHorizontal: 0 },
          ]}
        >
          <View style={styles.liveAssistColumn}>
            {showLiveAssist && !!meeting && (
              <Animated.View
                key="live-assist-panel"
                entering={FadeIn.duration(200)}
                style={[
                  styles.animatedPanel,
                  {
                    maxWidth: isKnowledgebaseSelectorOpen
                      ? DEFAULT_PANEL_WIDTH + 32
                      : DEFAULT_PANEL_WIDTH,
                  },
                ]}
              >
                <DragHandlerOverlay />
                <View
                  ref={liveAssistGlassRef}
                  style={[
                    styles.panel(theme),
                    { minWidth: DEFAULT_PANEL_WIDTH },
                    isKnowledgebaseSelectorOpen && {
                      paddingHorizontal: 0,
                      paddingVertical: 0,
                    },
                  ]}
                >
                  {isKnowledgebaseSelectorOpen ? null : (
                    <DesktopBottomGradient width={DEFAULT_PANEL_WIDTH} />
                  )}

                  <View style={styles.contentContainer}>
                    <View style={styles.header}>
                      <AssistModeSelector
                        isCompactMode={true}
                        onToggleKnowledgebaseSelector={
                          handleToggleKnowledgebaseSelector
                        }
                      />
                    </View>
                    {meeting && !isKnowledgebaseSelectorOpen && (
                      <LiveAssistSection meeting={meeting} compactMode />
                    )}
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
          {(isAssistPanelOpen || showNotes) && meeting && (
            <TranscriptSearchProvider>
              <Animated.View
                key="right-panel"
                entering={FadeIn.duration(200)}
                style={[styles.animatedPanel, { maxWidth: rightSize.width }]}
              >
                <DragHandlerOverlay />
                <View
                  ref={rightPanelGlassRef}
                  style={
                    isAssistPanelOpen
                      ? [
                          styles.panelWithStickyInput(theme),
                          {
                            minWidth: rightSize.width,
                            height:
                              rightPanelHeight - STICKY_INPUT_HEIGHT_OFFSET,
                          },
                        ]
                      : [
                          styles.panel(theme),
                          {
                            minWidth: rightSize.width,
                            height: rightSize.height - NOTES_HEIGHT_OFFSET,
                          },
                        ]
                  }
                >
                  {isAssistPanelOpen ? (
                    <>
                      <LiveAssistSidePanelHeader
                        showFredIcon={false}
                        showCreditsHint={!shouldShowPaywall}
                      />
                      <View
                        style={styles.contentContainer}
                        accessibilityRole="button"
                      >
                        <LiveAssistContent
                          meeting={meeting}
                          showHeader={false}
                          showAssistInput={false}
                          close={() => setAssistPanelOpen(false)}
                          containerRef={rightPanelGlassRef}
                          isDemo={isDemo}
                        />
                      </View>
                      {!shouldShowPaywall && (
                        <LiveAssistInput meeting={meeting} maxLines={2} />
                      )}
                    </>
                  ) : (
                    <CompactNotesTranscript
                      meeting={meeting}
                      activeContent={activeContent}
                      setActiveContent={setActiveContent}
                      panelHeight={rightSize.height}
                    />
                  )}
                  <CompactCardResizeHandle
                    onResizeStart={handleResizeStart}
                    onResize={handleResize}
                    onResizeEnd={handleResizeEnd}
                  />
                </View>
                {!isAssistPanelOpen && showNotes && (
                  <CopyAndSearchAction
                    currentTab={activeContent}
                    topMargin={12}
                    containerRef={rightPanelGlassRef}
                    showSearch={true}
                  />
                )}
                <Toaster containerRef={rightPanelGlassRef} />
              </Animated.View>
            </TranscriptSearchProvider>
          )}
        </View>
      )}

      {isStopDialogOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.dialogContainer}
        >
          <View ref={stopDialogGlassRef} style={styles.dialog}>
            <DragHandlerOverlay />
            <StopRecordingConfirm
              onSave={handleStopRecording}
              onDelete={handleDeleteRecording}
              onClose={handleContinueRecording}
            />
          </View>
        </Animated.View>
      )}

      {!isMinimized && isRecurringMeeting && isInRecurringSummaryWindow && (
        <Dock>
          <RecurringMeetingSummaryButton
            meeting={meeting}
            lastMeetingId={lastMeetingId}
            lastMeeting={lastMeeting ?? null}
            isInVisibilityWindow={isInRecurringSummaryWindow}
          />
        </Dock>
      )}
      {!isMinimized &&
        liveScreenContext?.activeSpeakerInsights?.map((insight) => (
          <Dock
            key={insight.type}
            glassSyncKey={`speakerInsight-${insight.type}`}
          >
            <Animated.View
              nativeID={"drag-region"}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <SpeakerInsightNudge insight={insight} />
            </Animated.View>
          </Dock>
        ))}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  // Centred under the header at one panel's width rather than the window's:
  // the window is two panels wide, and a notice stretched across all of it
  // reads as a page banner instead of a remark about the camera. Collapses to
  // nothing while the notice is in place.
  cameraNotice: {
    alignSelf: "center",
    width: DEFAULT_PANEL_WIDTH,
  },
  panelsContainer: {
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: PANEL_GAP,
    marginTop: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  animatedPanel: {
    ...vars.elevations[3],
    borderRadius: PANEL_CORNER_RADIUS,
    overflow: "hidden",
  },
  panel: (theme) => ({
    backgroundColor: theme.colors.pageBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: PANEL_CORNER_RADIUS,
    paddingVertical: 16,
    paddingHorizontal: 16,
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    position: "relative",
  }),
  panelWithStickyInput: (theme) => ({
    ...vars.elevations[3],
    backgroundColor: theme.colors.pageBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: PANEL_CORNER_RADIUS,
    flexDirection: "column",
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    position: "relative",
  }),
  contentContainer: {
    flex: 1,
    position: "relative",
    cursor: "auto",
  },
  header: {
    marginBottom: 16,
  },
  dialogContainer: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    zIndex: 1000,
  },
  // The card surface, border and shadow now come from StopRecordingConfirm so
  // the pill shows the exact same dialog as the full-screen view; this wrapper
  // only anchors the glass sync and drag overlay.
  dialog: {
    position: "relative",
  },
  meetingEndAnimation: (theme) => ({
    ...vars.elevations[3],
    color: theme.colors.textPrimary,
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    gap: 3,
    backgroundColor: theme.colors.pageBackground,
    borderColor: theme.colors.borderStaticSubtle,
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    borderWidth: 1,
    height: 36,
    alignItems: "center",
    padding: 12,
  }),
  animationContainer: {
    alignSelf: "center",
    flexDirection: "row",
    padding: 8,
  },
  liveAssistColumn: {
    flexDirection: "column",
  },
});
