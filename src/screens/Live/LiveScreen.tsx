import { IconLock, IconWarning } from "@/assets/svg";
import { ErrorScreen, NotFoundScreen } from "@/components/Error";
import { isForbiddenError, shouldRetryError } from "@/errors";
import { openLoginPopup, useAuth } from "@/features/auth";
import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";
import { useQuery } from "@apollo/client";
import { GetMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import { TranscriptionMode } from "@firefliesai/shared-libs.utils";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import type { ParamList } from "../types";
import {
  LiveScreenProvider,
  useOptionalLiveScreenContext,
} from "./Context/LiveScreenContext";
import { LiveScreenContent } from "./LiveScreenContent";
import { MeetingActivityReporter } from "./MeetingActivityReporter";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { ThreadProvider as FredThreadProvider } from "@firefliesai/fred-react";
import { AssistThreadProvider } from "@/features/ask-fred";
import {
  getActualPlatform,
  isDesktop,
  isMainDesktopWindow,
} from "@/utils/device";
import { LiveCompactSurface } from "./LiveCompactSurface";
import { isLiveMeeting, useDesktopAssistUIState } from "@/features/live";
import { LoadingScreen } from "@/components/Loading";
import { LiveMeetingView } from "@/screens/Record/LiveMeetingView";
import { View } from "react-native";
import { createStyles, useTheme } from "@/styles";

// Wrapper to pass LiveScreenContext callback to AssistThreadProvider
const AssistThreadProviderWithContext: FC<
  PropsWithChildren<{ meetingId: string }>
> = ({ children, meetingId }) => {
  const liveScreenContext = useOptionalLiveScreenContext();
  return (
    <AssistThreadProvider
      meetingId={meetingId}
      onCreditsExhausted={liveScreenContext?.triggerSalesAssistPaywall}
    >
      {children}
    </AssistThreadProvider>
  );
};

export const LiveScreen: FC<NativeStackScreenProps<ParamList, "Live">> = ({
  route,
}) => {
  const meetingId = route.params.id;
  const source = route.params.source ?? "deeplink";

  const { user } = useAuth();
  const theme = useTheme();

  const transcriptionMode = useFeatureValue<string | null>(
    FEATURE_FLAGS.GLOBAL_TRANSCRIPTION_MODE,
    null,
  );
  const isTranscriptionDisabled =
    transcriptionMode === TranscriptionMode.DISABLED;

  const { data, error, loading, refetch } = useQuery(GetMeetingDocument, {
    variables: {
      id: meetingId,
    },
    notifyOnNetworkStatusChange: true,
    skip: isTranscriptionDisabled,
  });

  // Desktop-specific UI state: compact/full mode
  const { isCompactView, toggleViewMode } = useDesktopAssistUIState();
  // The pill's meeting meter only exists with the Universal Pill, which is
  // shelved for now — the legacy bar is the default either way. Re-key this
  // to useIsDictationAvailable() to ship it.
  const isUniversalPill = false;

  // Track when the live view has been reparented to the main window.
  // This state triggers a re-render so shouldShowCompactView and the
  // mainWindowRoot style are re-evaluated with the updated window identity.
  const [isReparentedToMain, setIsReparentedToMain] = useState(false);
  useEffect(() => {
    if (!isDesktop) return;
    const unsubscribe = window.electron?.liveView?.onReparentedToMain?.(() => {
      setIsReparentedToMain(true);
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  const shouldShowCompactView =
    isDesktop &&
    isCompactView &&
    !isReparentedToMain &&
    !isMainDesktopWindow() &&
    (data?.meeting ? isLiveMeeting(data.meeting) : true);

  useEffect(() => {
    if (isTranscriptionDisabled || !data?.meeting?.addedBy) return;
    tracker.track(TRACKING_EVENTS.LIVE_MEETING_OPENED, {
      source,
      addedBy: data?.meeting?.addedBy,
    });
  }, [source, isTranscriptionDisabled, data?.meeting?.addedBy]);

  if (isTranscriptionDisabled) {
    return (
      <ErrorScreen
        Icon={IconWarning}
        title="Live transcripts are disabled"
        description="Live transcripts are disabled by your organization admin"
      />
    );
  }

  if (!data?.meeting && loading) {
    if (!isDesktop) return <LoadingScreen />;
    // Wrap with minimal providers to prevent context errors
    // Skip LiveScreenProvider as it requires a meeting
    return (
      <FredThreadProvider meetingId="">
        <AssistThreadProvider meetingId="">
          {shouldShowCompactView ? (
            <LiveCompactSurface
              meeting={null}
              onToggleViewMode={toggleViewMode}
            />
          ) : (
            <LiveScreenContent meeting={null} />
          )}
        </AssistThreadProvider>
      </FredThreadProvider>
    );
  }

  if (!data?.meeting && error) {
    if (isForbiddenError(error?.graphQLErrors?.[0] || error)) {
      if (!user) {
        return (
          <ErrorScreen
            login={() => openLoginPopup("live")}
            Icon={IconLock}
            title="This meeting is private"
            description="Login to check your meeting access"
          />
        );
      }

      return (
        <ErrorScreen
          Icon={IconLock}
          title="You do not have permission to view this meeting"
          description="Request meeting host for access"
        />
      );
    }
    return (
      <ErrorScreen
        description={error.message}
        retry={shouldRetryError(error) ? refetch : undefined}
      />
    );
  }

  if (!data?.meeting) {
    return (
      <NotFoundScreen
        title="Meeting not found"
        description="It does not exist or you do not have access"
      />
    );
  }

  if (!isDesktop) {
    return <LiveMeetingView meeting={data.meeting} />;
  }

  return (
    <LiveScreenProvider meeting={data.meeting}>
      {isUniversalPill && <MeetingActivityReporter />}
      <FredThreadProvider meetingId={data.meeting.id}>
        <AssistThreadProviderWithContext meetingId={data.meeting.id}>
          {shouldShowCompactView ? (
            <LiveCompactSurface
              meeting={data.meeting}
              onToggleViewMode={toggleViewMode}
            />
          ) : (
            <View
              style={[
                styles.root(theme),
                (isReparentedToMain || isMainDesktopWindow()) &&
                  styles.mainWindowRoot(theme),
                isReparentedToMain && styles.reparentedTopInset,
              ]}
            >
              <LiveScreenContent
                meeting={data.meeting}
                onToggleViewMode={toggleViewMode}
              />
            </View>
          )}
        </AssistThreadProviderWithContext>
      </FredThreadProvider>
    </LiveScreenProvider>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    borderRadius: getActualPlatform() === "win32" ? 0 : 8,
    borderBottomLeftRadius: getActualPlatform() === "win32" ? 8 : 0,
    borderBottomRightRadius: getActualPlatform() === "win32" ? 8 : 0,
    overflow: "hidden",
    backgroundColor:
      getActualPlatform() === "win32"
        ? theme.colors.layerDefault
        : "transparent",
  }),
  // When the live view is reparented onto the main window it fills the
  // entire content area. The floating-window styling (transparent background,
  // rounded corners, box shadow) would let the main page bleed through, so
  // we override with an opaque background and remove decorations.
  mainWindowRoot: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    borderWidth: 0,
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    boxShadow: "none",
  }),
  // Only the reparented post-meeting overlay (PostMeetingPanel) needs this: it
  // does not inset for the macOS title bar itself, so push it below the traffic
  // lights + drag area. The live panel and notepad headers already clear the
  // traffic lights via getWindowChromeLeftInset, so they must NOT get this extra
  // top padding — it would double the offset and shove the whole header down.
  reparentedTopInset: {
    paddingTop: getActualPlatform() === "darwin" ? 52 : 0,
  },
});
