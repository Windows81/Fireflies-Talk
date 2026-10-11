import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import type { ParamList } from "@/screens/types";
import { RootNavigation } from "@/screens/RootNavigation";
import { RouteNames } from "@/constants";
import { useUpcomingCalendarEvents } from "@/features/calendar";
import {
  useDesktopNotificationManager,
  useLiveMeetingNotifier,
  DesktopInviteFredModal,
  initDailyBriefNotifications,
  disposeDailyBriefNotifications,
} from "@/features/desktop-notifications";
import { ScrollView } from "react-native-gesture-handler";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import {
  DEFAULT_WINDOW_CHROME_INSET,
  getWindowChromeTopInset,
} from "@/utils/desktopWindowChrome";
import { DesktopPersonalAssistantSection } from "./components/DesktopPersonalAssistantSection";
import { DesktopPersonalAssistantTiles } from "./components/DesktopPersonalAssistantTiles";
import { DesktopMeetingsList } from "./components/DesktopMeetingsList";
import { DesktopSide } from "./components/DesktopSide";
import { DesktopMeetingPrep } from "./components/DesktopMeetingPrep";
import {
  MeetingBanner,
  PendingNotetakerBanner,
} from "./components/MeetingBanner";
import { LocalMeetingItem } from "./components/LocalMeetingItem";
import { useMeetingBanners } from "./hooks/useMeetingBanners";
import { FirstTimeAfterOnboardingDemo } from "./components/FirstTimeAfterOnboardingDemo";
import { MainDesktopHeader } from "./components/MainDesktopHeader";
import {
  ConsentSetupCard,
  useConsentSetupPrompt,
  type ConsentSetupPrompt,
} from "./components/ConsentSetup";
import { CameraNoticeRequiredCard } from "./components/ConsentSetup/CameraNoticeRequiredCard";
import { UpdateAppCard } from "./components/UpdateAppCard";
import type { DesktopHomeTab } from "./components/DesktopHomeTabBar";
import { DictationHistoryList } from "./components/DictationHistoryList";
import { DictationOnboarding } from "./DictationOnboarding";
import { DictationStatsCard } from "./components/DictationStatsCard";
import { DictationWelcomeBanner } from "./components/DictationWelcomeBanner";
import { DictationDisabledBanner } from "./components/DictationDisabledBanner";
import { TalkIntroBanner } from "./components/TalkIntroBanner";
import {
  resolveDesktopHomeTab,
  shouldResumeDictationOnboardingOnLaunch,
  shouldShowDictationOnboarding,
  shouldShowTalkIntroBanner,
} from "./DictationOnboarding/progress";
import {
  setDictationOnboardingOpen,
  useDictationOnboardingOpen,
} from "./DictationOnboarding/open.store";
import { useDictationOnboardingProgress } from "./DictationOnboarding/progress.store";
import { useIsTalkFirstHome } from "./DictationOnboarding/useIsTalkFirstHome";
import {
  useGetCurrentUserQuery,
  useGetFeedMeetingsQuery,
  type CalendarEvents,
} from "@/graphql";
import { NotificationBars } from "../components";
import {
  RecordActionsContextProvider,
  useAutoStartNotesOnMicDetection,
  useAutoStartNotesUpsell,
  useAutoStopRecordingOnMicRelease,
  useDesktopTrayMenuListener,
  useRecordActionsContext,
  toRecordingSourceAttendees,
  toRecordingSourceCalendarWindow,
  type RecordingSource,
  type StartInputs,
} from "@/features/live-record";
import { useTeamsConsentNotifier } from "@/features/teams-consent";
import { useBrowserConsentNotifier } from "@/features/live-record/useBrowserConsentNotifier";
import { useCameraConsentNotifier } from "@/features/camera-consent";
import {
  useCameraNoticeGuidanceStore,
  useConsentPolicyRefresh,
} from "@/features/consent-policy";
import { useDictation } from "@/hooks/useDictation";
import {
  getLifetimeWords,
  useDictationHistory,
} from "@/hooks/dictationHistory";
import { useAuth } from "@/features/auth";
import {
  useSyncTalkActionMode,
  useSyncTalkPolishAction,
} from "@/features/settings";
import { useIsDictationAvailable } from "@/hooks/useIsDictationAvailable";
import { useIsDictationOffered } from "@/hooks/useIsDictationOffered";
import { useAudioConsentNotifier } from "@/features/live-record/useAudioConsentNotifier";
import { useLiveMeetings } from "@/features/live";
import {
  MaintenanceBanner,
  useShowMaintenanceBanner,
} from "@/features/maintenance";
import {
  useLocalMeetingRecordingSync,
  useMeetingDetection,
  meetingDetectionApi,
  findCalendarTitleForDetectedMeeting,
  claimCalendarMeetingFromRecordingSource,
} from "@/features/desktop-meeting-detection";
import { TrialBanner } from "@/features/free-trial";
import { openURL } from "@/features/navigation/utils";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import {
  WalkthroughOverlay,
  useWalkthrough,
  WALKTHROUGH_STEPS,
} from "@/features/walkthrough";
import { useShouldShowOnboarding } from "@/features/onboarding";
import {
  DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY,
  DESKTOP_FIRST_TIME_DEMO_FLAG_KEY,
  DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY,
  DESKTOP_TALK_INTRO_BANNER_DISMISSED_FLAG_KEY,
  clearLocalUserFlag,
  getLocalUserFlag,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { usePollingIntervals } from "@/features/polling-intervals";
import { useMeetingStateAfterSignup } from "./hooks/useMeetingStateAfterSignup";
import type { RecordingTriggerPayload } from "electron/src/types";
import { useSyncDesktopCalendar } from "./hooks/useSyncDesktopCalendar";
import { useTrayInviteListener } from "./hooks/useTrayInviteListener";
import { useListMeetingPreps } from "@/hooks/useListMeetingPreps";

/** Permanent for now — no condition drops it. */
const DICTATION_BETA_TAB: DesktopHomeTab[] = ["dictation"];

const findEventById = (
  events: (CalendarEvents | undefined)[] | undefined,
  id: string | null,
): CalendarEvents | undefined =>
  id ? events?.find((event) => event?._id === id) : undefined;

const buildRecordingSource = (
  payload?: RecordingTriggerPayload,
): RecordingSource | undefined => {
  if (!payload) return { type: "tray" };

  const parsedProcessId =
    typeof payload.processId === "number"
      ? payload.processId
      : payload.processId
        ? Number(payload.processId)
        : NaN;
  const processId = Number.isFinite(parsedProcessId)
    ? parsedProcessId
    : undefined;

  return {
    type: payload.source,
    trigger: payload.trigger,
    title: payload.title,
    processId,
    processName: payload.processName,
    parentProcessName: payload.parentProcessName,
    parentProcessId: payload.parentProcessId,
    platform: payload.platform,
    displayName: payload.displayName,
    meetingUrl: payload.meetingUrl,
    joinUrl: payload.joinUrl,
    calendarEventId: payload.calendarEventId,
    iCalUID: payload.iCalUID,
  };
};

const DesktopRecordingElectronListener = ({
  calendarEvents,
  consentSetup,
}: {
  calendarEvents?: CalendarEvents[];
  /** The one-time setup, which takes the first start of an install. */
  consentSetup: ConsentSetupPrompt;
}) => {
  const { startRecording, startInputs } = useRecordActionsContext();
  const { handleTakeNotesFromNotification } = useAutoStartNotesUpsell();

  /**
   * Starts notes unless the consent setup is still owed or already up, in
   * which case the card takes this start and runs it once the user has
   * answered.
   *
   * Every automated trigger goes through here — mic detection, the tray, a
   * meeting notification — so the card is offered once regardless of which of
   * them is the user's first recording, and the choices they make apply to it
   * rather than to the one after. The card also stays up, holding nothing,
   * while the admin's camera notice is not set up; a start arriving then
   * brings it forward and waits on it, since the gate would refuse it anyway.
   */
  const startWithConsent = useCallback(
    (inputs?: StartInputs) => {
      // Already holding one. Answering starts it, so a trigger arriving
      // meanwhile must neither slip past it nor queue a second — detection can
      // fire again while the card waits on System Settings.
      if (consentSetup.holdingStart) return Promise.resolve();

      if (consentSetup.pending || consentSetup.visible) {
        consentSetup.show(() => {
          void startRecording(inputs);
        });
        return Promise.resolve();
      }

      return startRecording(inputs);
    },
    [consentSetup, startRecording],
  );

  useAutoStartNotesOnMicDetection(startWithConsent, startInputs);
  useAutoStopRecordingOnMicRelease();
  useTeamsConsentNotifier();
  useBrowserConsentNotifier();
  useDictation();
  useSyncTalkActionMode();
  useSyncTalkPolishAction();
  useAudioConsentNotifier();
  useCameraConsentNotifier();
  useConsentPolicyRefresh();

  useDesktopTrayMenuListener({
    onStartRecording: (payload) => {
      const recordingSource = buildRecordingSource(payload);
      if (recordingSource?.trigger === "calendar_event") {
        claimCalendarMeetingFromRecordingSource(recordingSource);
        if (recordingSource.joinUrl) {
          openURL(recordingSource.joinUrl, { newTab: true });
        }
      }
      const matchingCalendarTitle =
        recordingSource?.type === "notification"
          ? findCalendarTitleForDetectedMeeting(calendarEvents, {
              url: recordingSource.meetingUrl,
              platform: recordingSource.platform,
            })
          : null;
      const resolvedTitle = startInputs.title.trim()
        ? startInputs.title
        : recordingSource?.title?.trim() || matchingCalendarTitle || "";

      // Attach attendees from the matched calendar event so they can be synced
      // to the meeting when the recording ends (before upload).
      const matchingEvent =
        recordingSource?.trigger === "calendar_event"
          ? calendarEvents?.find(
              (e) =>
                e._id === recordingSource.calendarEventId ||
                e.iCalUID === recordingSource.iCalUID,
            )
          : null;
      const attendees = toRecordingSourceAttendees(matchingEvent?.attendees);
      const resolvedRecordingSource = attendees.length
        ? {
            ...recordingSource,
            attendees,
            ...toRecordingSourceCalendarWindow(matchingEvent),
          }
        : recordingSource;

      startWithConsent({
        ...startInputs,
        title: resolvedTitle,
        recordingSource: resolvedRecordingSource,
      });

      // Show upsell after "Take Notes" clicks from meeting-detection notifications
      if (
        payload?.source === "notification" &&
        payload?.trigger !== "calendar_event"
      ) {
        handleTakeNotesFromNotification();
      }
    },
  });

  return null;
};

export const MainDesktopScreen: React.FC<
  NativeStackScreenProps<ParamList, "MainDesktop">
> = ({ route }) => {
  const landedFromOnboarding = route.params?.fromDesktopOnboarding === true;
  const theme = useTheme();
  const { data: dataUser, loading: isLoadingUser } = useGetCurrentUserQuery();
  const user = dataUser?.user;
  const calendarEventProps = useUpcomingCalendarEvents();

  const { recentMeetingsDesktop: recentMeetingPollInterval } =
    usePollingIntervals();
  const { liveMeetings, refetch: refetchLiveMeetings } = useLiveMeetings({
    calendarEventProps,
  });

  // Desktop notification owner for live meetings — mounted once in the main window.
  useLiveMeetingNotifier();

  const { meetingPrepEventIds } = useListMeetingPreps();

  useSyncDesktopCalendar({
    events: calendarEventProps.events,
    liveMeetings,
    hasUser: Boolean(user),
    isLoadingEvents: calendarEventProps.isLoadingEvents,
    isLoadingUser,
    meetingPrepEventIds,
  });
  const { data } = useGetFeedMeetingsQuery({
    notifyOnNetworkStatusChange: true,
    pollInterval: recentMeetingPollInterval,
    skip: !user,
  });

  const feedMeetings = data?.getFeedMeetings.meetings || [];

  const { isNewUser } = useMeetingStateAfterSignup(
    feedMeetings,
    user?.createdAt,
  );

  // Refetch live meetings when triggered from another window (e.g., live window meeting end)
  useEffect(() => {
    const electron = window.electron;
    if (!electron?.onTriggerRefetch) return;

    const unsubscribe = electron.onTriggerRefetch(() => {
      refetchLiveMeetings();
    });

    return unsubscribe;
  }, [refetchLiveMeetings]);

  const manager = useDesktopNotificationManager({
    ...calendarEventProps,
    liveMeetings,
  });

  useEffect(() => {
    initDailyBriefNotifications();
    return () => disposeDailyBriefNotifications();
  }, []);

  // Unified meeting detection (browser + audio)
  useMeetingDetection({
    calendarEvents: calendarEventProps,
  });
  useLocalMeetingRecordingSync();

  const [selectedEventIdForPrep, setSelectedEventIdForPrep] = [
    manager.selectedEventIdForPrep,
    manager.setSelectedEventIdForPrep,
  ];
  const [isBrowserMeetingModalOpen, closeBrowserMeetingModal] = [
    manager.isBrowserMeetingModalOpen,
    manager.closeBrowserMeetingModal,
  ];
  const [selectedMeetingUrl] = [manager.selectedMeetingUrl];
  const [pendingInviteActionUrl] = [manager.pendingInviteActionUrl];
  const handleOpenInviteModal = (prefilledUrl?: string) => {
    manager.setSelectedMeetingUrl(prefilledUrl || "");
    manager.setPendingInviteActionUrl(null);
    manager.openBrowserMeetingModal();
  };

  const {
    isInvitePanelOpen,
    setIsInvitePanelOpen,
    invitePrefilledUrl,
    setInvitePrefilledUrl,
  } = useTrayInviteListener();

  const handleInviteSuccess = () => {
    if (!pendingInviteActionUrl) return;
    meetingDetectionApi.markLocalMeetingInvited(pendingInviteActionUrl);
    manager.setPendingInviteActionUrl(null);
  };

  const handleMeetingPrepClick = (event: CalendarEvents) => {
    tracker.track(TRACKING_EVENTS.MEETING_PREP_OPENED, {
      from: "desktop-sidebar",
      isOrganizer: event.isOrganizer,
      fredAdded: event.fredAdded,
      isValidMeeting: event.isValidMeeting,
      manuallyToggled: event.manuallyToggled,
    });
    setSelectedEventIdForPrep(event._id || null);
  };

  const handleCloseMeetingPrep = () => {
    setSelectedEventIdForPrep(null);
  };

  // Calendar meetings to surface as home banners (upcoming + live-not-joined)
  const meetingBanners = useMeetingBanners(
    calendarEventProps.events,
    liveMeetings,
  );

  // Resolve the event to open in prep. Search the live calendar feed and the
  // banners' own events: a live meeting is often bridged from the detection
  // store and has already dropped out of the upcoming feed, so the feed lookup
  // alone would silently fail and "View Prep" would do nothing.
  const selectedEventForPrep =
    findEventById(calendarEventProps.events, selectedEventIdForPrep) ??
    findEventById(
      meetingBanners.map((b) => b.event),
      selectedEventIdForPrep,
    ) ??
    null;

  // Walkthrough target refs (step index -> ref to target element)
  const settingsRef = useRef<View>(null);
  const upcomingMeetingsRef = useRef<View>(null);
  const firstMeetingRef = useRef<View>(null);
  const recordButtonRef = useRef<View>(null);
  const walkthroughTargetRefs = useMemo(
    () => ({
      0: upcomingMeetingsRef,
      1: recordButtonRef,
      2: settingsRef,
    }),
    [],
  );

  const { completed: onboardingCompleted, loading: onboardingLoading } =
    useShouldShowOnboarding();
  const demoWatched =
    !!getLocalUserFlag(DESKTOP_FIRST_TIME_DEMO_FLAG_KEY) ||
    !!getLocalUserFlag(DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY);

  const canStartWalkthrough =
    !onboardingLoading && onboardingCompleted && demoWatched;

  useWalkthrough(`desktop-main-${user?.email}`, WALKTHROUGH_STEPS.length);

  const shouldShowMaintenanceBanner = useShowMaintenanceBanner();

  const isDictationAvailable = useIsDictationAvailable();
  const isDictationOffered = useIsDictationOffered();
  const { talkFirst } = useIsTalkFirstHome();
  const [selectedTab, setSelectedTab] = useState<DesktopHomeTab>("notetaker");

  const dictationOnboardingDone = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY],
  );

  const talkIntroBannerDismissed = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_TALK_INTRO_BANNER_DISMISSED_FLAG_KEY],
  );

  const userId = useAuth((s) => s.user?.id);
  const hasDictated = useDictationHistory(
    (s) =>
      getLifetimeWords(s, userId) > 0 ||
      s.entries.some((entry) => entry.userId === userId),
  );

  const showTalkIntroBanner = shouldShowTalkIntroBanner({
    enabled: isDictationAvailable,
    completed: dictationOnboardingDone,
    dismissed: talkIntroBannerDismissed,
    hasDictated,
  });

  const dictationOnboardingStep = useDictationOnboardingProgress((s) => s.step);
  const dictationOnboardingOpen =
    useDictationOnboardingOpen((s) => s.open) && !dictationOnboardingDone;
  const [didResumePermissions, setDidResumePermissions] = useState(false);
  const [didApplyTalkFirst, setDidApplyTalkFirst] = useState(false);

  const activeTab = resolveDesktopHomeTab({
    enabled: isDictationOffered,
    selectedTab,
    onboardingOpen: dictationOnboardingOpen,
  });
  const consentSetup = useConsentSetupPrompt();
  const cameraGuidanceVisible = useCameraNoticeGuidanceStore(
    (state) => state.visible,
  );
  // This screen is mounted more than once — see consentSetupPrompt.store — and
  // only the focused copy is on screen, so only it renders overlays.
  const isFocused = useIsFocused();

  const shouldResumePermissions =
    isFocused &&
    shouldResumeDictationOnboardingOnLaunch({
      enabled: isDictationAvailable,
      completed: dictationOnboardingDone,
      step: dictationOnboardingStep,
    });

  if (shouldResumePermissions && !didResumePermissions) {
    setDidResumePermissions(true);
    setSelectedTab("dictation");
  }

  if (talkFirst && !didApplyTalkFirst) {
    setDidApplyTalkFirst(true);
    setSelectedTab("dictation");
  }

  const shouldOpenDictationOnboarding = shouldShowDictationOnboarding({
    enabled: isDictationAvailable,
    completed: dictationOnboardingDone,
    dictationTabActive: activeTab === "dictation",
  });

  useEffect(() => {
    if (shouldOpenDictationOnboarding) setDictationOnboardingOpen(true);
  }, [shouldOpenDictationOnboarding]);

  const completeDictationOnboarding = useCallback(() => {
    setDictationOnboardingOpen(false);
    useDictationOnboardingProgress.getState().reset();
    setLocalUserFlag(DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY, true);
  }, []);

  const handleGetOnboarded = useCallback(() => {
    useDictationOnboardingProgress.getState().reset();
    clearLocalUserFlag(DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY);
    useDictationOnboardingProgress.getState().begin("get-onboarded");
  }, []);

  const handleTabChange = useCallback(
    (tab: DesktopHomeTab) => {
      if (tab === "notetaker" && talkFirst) {
        RootNavigation.navigate(RouteNames.DesktopOnboarding);
        return;
      }
      setSelectedTab(tab);
    },
    [talkFirst],
  );

  const handleTryTalk = useCallback(() => {
    useDictationOnboardingProgress.getState().reset();
    useDictationOnboardingProgress.getState().begin("talk-intro-banner");
    setSelectedTab("dictation");
  }, []);

  const handleDismissTalkIntroBanner = useCallback(() => {
    setLocalUserFlag(DESKTOP_TALK_INTRO_BANNER_DISMISSED_FLAG_KEY, true);
  }, []);

  useEffect(() => {
    if (isInvitePanelOpen) setSelectedTab("notetaker");
  }, [isInvitePanelOpen]);

  return (
    <>
      <RecordActionsContextProvider>
        <View style={[styles.root(theme)]}>
          <FirstTimeAfterOnboardingDemo
            landedFromOnboarding={landedFromOnboarding}
          />
          <DesktopRecordingElectronListener
            calendarEvents={calendarEventProps.events}
            consentSetup={consentSetup}
          />
          <MainDesktopHeader
            showBackButton={!!selectedEventForPrep}
            onBack={handleCloseMeetingPrep}
            recordButtonRef={recordButtonRef}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            betaTabs={DICTATION_BETA_TAB}
            consentSetupPending={consentSetup.pending}
            onConsentSetupNeeded={consentSetup.show}
          />

          <TrialBanner />

          <NotificationBars />

          <View style={styles.content}>
            {selectedEventForPrep ? (
              <DesktopMeetingPrep event={selectedEventForPrep} />
            ) : (
              <ScrollView
                style={styles.leftPane}
                contentContainerStyle={[
                  styles.leftPaneContent,
                  activeTab === "dictation" && styles.leftPaneContentDictation,
                ]}
                showsVerticalScrollIndicator={false}
              >
                {activeTab === "notetaker" ? (
                  <>
                    {shouldShowMaintenanceBanner && <MaintenanceBanner />}
                    {showTalkIntroBanner && (
                      <View
                        style={[
                          styles.bannerFrame,
                          styles.greetingFrameSpacing,
                        ]}
                      >
                        <TalkIntroBanner
                          onTry={handleTryTalk}
                          onDismiss={handleDismissTalkIntroBanner}
                        />
                      </View>
                    )}
                    <View
                      style={[
                        styles.greetingFrame,
                        styles.greetingFrameSpacing,
                      ]}
                    >
                      {user && (
                        <DesktopPersonalAssistantSection
                          user={user}
                          isNewUser={isNewUser}
                        />
                      )}
                      {meetingBanners.length > 0 && (
                        <View style={styles.bannerFrame}>
                          {meetingBanners.map(
                            ({
                              key,
                              event,
                              state,
                              liveMeeting,
                              localRecord,
                              pending,
                              userJoined,
                            }) => {
                              if (state === "detected") {
                                return localRecord ? (
                                  <LocalMeetingItem
                                    key={key}
                                    record={localRecord}
                                    onOpenInviteModal={handleOpenInviteModal}
                                  />
                                ) : null;
                              }
                              if (state === "pending") {
                                return pending ? (
                                  <PendingNotetakerBanner
                                    key={key}
                                    url={pending.url}
                                  />
                                ) : null;
                              }
                              return (
                                <MeetingBanner
                                  key={key}
                                  event={event}
                                  liveMeeting={liveMeeting}
                                  state={state}
                                  userJoined={userJoined}
                                  hidePrep={meetingBanners.length > 1}
                                  onMeetingPrepClick={handleMeetingPrepClick}
                                />
                              );
                            },
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.tilesSpacing}>
                      <DesktopPersonalAssistantTiles
                        onMeetingPrepClick={handleMeetingPrepClick}
                      />
                    </View>
                    <DesktopMeetingsList />
                  </>
                ) : (
                  <>
                    <View style={styles.dictationLayout}>
                      <View style={styles.dictationMain}>
                        {isDictationAvailable ? (
                          <DictationWelcomeBanner
                            firstName={
                              user?.profile?.firstName ||
                              user?.profile?.name ||
                              ""
                            }
                            onGetOnboarded={handleGetOnboarded}
                          />
                        ) : (
                          <DictationDisabledBanner />
                        )}
                        <DictationHistoryList />
                      </View>
                      <DictationStatsCard />
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            {activeTab === "notetaker" && (
              <DesktopSide
                {...calendarEventProps}
                liveMeetings={liveMeetings}
                onMeetingPrepClick={handleMeetingPrepClick}
                settingsRef={settingsRef}
                upcomingMeetingsRef={upcomingMeetingsRef}
                firstMeetingRef={firstMeetingRef}
                isInviteOpen={isInvitePanelOpen}
                invitePrefilledUrl={invitePrefilledUrl}
                onInviteOpenChange={(open) => {
                  setIsInvitePanelOpen(open);
                  if (!open) setInvitePrefilledUrl(undefined);
                }}
              />
            )}
          </View>

          {activeTab === "notetaker" && (
            <WalkthroughOverlay
              name={`desktop-main-${user?.email}`}
              targetRefs={walkthroughTargetRefs}
              canStart={canStartWalkthrough}
            />
          )}
          <UpdateAppCard />

          {consentSetup.visible && isFocused && (
            <ConsentSetupCard onFinished={consentSetup.finish} />
          )}
          {cameraGuidanceVisible && isFocused && <CameraNoticeRequiredCard />}

          {isFocused &&
            isDictationAvailable &&
            activeTab === "dictation" &&
            dictationOnboardingOpen && (
              <View style={styles.onboardingOverlay}>
                <DictationOnboarding onComplete={completeDictationOnboarding} />
              </View>
            )}
        </View>

        <DesktopInviteFredModal
          isOpen={isBrowserMeetingModalOpen}
          close={closeBrowserMeetingModal}
          prefilledUrl={selectedMeetingUrl}
          onInviteSuccess={handleInviteSuccess}
        />
      </RecordActionsContextProvider>
    </>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    flexDirection: "column",
    paddingTop: 52,
    borderColor: theme.colors.borderStaticPage,
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    borderWidth: 1,
    borderRadius: 12,
  }),
  content: {
    flex: 1,
    flexDirection: "row",
    gap: 0,
    backgroundColor: DESKTOP_THEME.grey1050,
  },
  onboardingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    padding: DEFAULT_WINDOW_CHROME_INSET,
    // Keeps the card clear of the macOS window buttons, which would otherwise
    // sit on top of it and its back button.
    paddingTop: getWindowChromeTopInset(),
    backgroundColor: DESKTOP_THEME.grey1050,
  },
  leftPane: {
    flexGrow: 1,
  },
  // The dictation tab has no right sidebar, and its banner + stats card need
  // more than the 14% inset leaves. Trimming only the right inset keeps the
  // banner and history table where they are and gives the room to the stats
  // card, which sits out past the table's right edge.
  leftPaneContentDictation: {
    paddingRight: "2%",
  },
  leftPaneContent: {
    paddingTop: 36,
    paddingBottom: 64,
    paddingHorizontal: "14%",
    gap: 0,
    width: "100%",
    flexGrow: 1,
  },
  // Greeting + Live Now in one frame with 16px gap (Figma: Frame 2147227474)
  greetingFrame: {
    gap: 16,
    alignSelf: "stretch",
  },
  greetingFrameSpacing: {
    marginBottom: 20,
  },
  tilesSpacing: {
    marginBottom: 48,
  },
  // Two columns: the banner and history stacked on the left, the stat cards on
  // the right. Keeping them in separate columns lets the taller stat column
  // overhang instead of pushing the history table down past it, and caps the
  // banner and table at one shared width so their edges always line up.
  dictationLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    width: "100%",
  },
  dictationMain: {
    flex: 1,
    minWidth: 0,
    maxWidth: 768,
    gap: 32,
  },
  bannerFrame: {
    paddingHorizontal: 16,
    gap: 16,
    // Match the Personal Assistant tiles row (see DesktopPersonalAssistantTiles):
    // cap at the design width but shrink with the pane so the banner's right edge
    // stays aligned with the last tile and never clips behind the sidebar.
    width: "100%",
    maxWidth: 768,
  },
});
