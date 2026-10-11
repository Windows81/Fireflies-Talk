import { promptConfirmation } from "@/components/Dialog";
import { Config, RouteNames } from "@/constants";
import {
  LocalRecordingsDialog,
  recordPhaseApi,
  RecordActionsContextProvider,
  UnuploadedRecordingBanner,
  useRecordActionsContext,
  useRecorder,
  WebLeavePageWarning,
} from "@/features/live-record";
import {
  PENDING_RECORDING_NOTES_KEY,
  useManualNotesStore,
} from "@/features/manual-notes";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type FC,
} from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import { RecordLiveView } from "./RecordLiveView";

type Props = NativeStackScreenProps<ParamList, "Record">;

/** Notes-first recording screen: auto-starts recording on mount. */
export const RecordLiveScreen: FC<Props> = (props) => {
  const theme = useTheme();
  const fromDashboard =
    Platform.OS === "web" && theme.breakpoint !== Breakpoint.Small;

  useLayoutEffect(() => {
    props.navigation.setOptions({ headerShown: false });
  }, [props.navigation]);

  return (
    <RecordActionsContextProvider fromDashboard={fromDashboard}>
      <RecordLiveScreenContent {...props} fromDashboard={fromDashboard} />
    </RecordActionsContextProvider>
  );
};

const RecordLiveScreenContent: FC<Props & { fromDashboard: boolean }> = ({
  route,
  navigation,
  fromDashboard,
}) => {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [isOpenRecordings, openRecordings, closeRecordings] = useBooleanState();
  const { startRecording, stopRecording, setStartInputs } =
    useRecordActionsContext();

  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);

  // A stale widget "stop" tap must never start a new recording.
  const initialActionRef = useRef(route.params?.action);

  useLayoutEffect(() => {
    if (route.params?.title) {
      setStartInputs((prev) => ({ ...prev, title: route.params!.title! }));
    }
    if (!route.params?.action) return;
    const { action, source } = route.params;

    if (source) {
      tracker.track(TRACKING_EVENTS.WIDGET_RECORDING_ACTION, {
        action,
        source,
      });
    }

    // The widget stop deep link keeps its confirmation dialog.
    if (action === "stop") {
      promptConfirmation({
        title: "Stop recording?",
        cancelText: "No, continue",
        confirmText: "Stop recording",
        onConfirm: stopRecording,
      });
    } else if (action === "local-recordings") {
      openRecordings();
    }
    navigation.setParams({ action: undefined, title: undefined });
  }, [navigation, route.params, stopRecording, setStartInputs, openRecordings]);

  const autoStartAttemptedRef = useRef(false);
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    autoStartAttemptedRef.current = true;
    if (initialActionRef.current === "stop") return;

    const { status } = useRecorder.getState();
    if (status.state !== "inactive" || status.streamingState !== "inactive") {
      return;
    }
    void startRecording();
  }, [startRecording]);

  // A start that never created a meeting leaves its notes under the pending
  // key, where the next recording to succeed would adopt them. Leaving with
  // nothing in flight means this attempt is over and they were never claimed.
  useEffect(
    () => () => {
      if (useRecorder.getState().context?.meetingId) return;
      if (recordPhaseApi.isBusy()) return;
      useManualNotesStore.getState().clearMeeting(PENDING_RECORDING_NOTES_KEY);
    },
    [],
  );

  const navigateAway = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(RouteNames.Main);
    }
  }, [navigation]);

  const onBack = useCallback(() => {
    if (fromDashboard) {
      const { status } = useRecorder.getState();
      window.open(
        Config.DASHBOARD_URL,
        status.state === "inactive" && status.streamingState === "inactive"
          ? "_self"
          : "_blank",
      );
      return;
    }
    navigateAway();
  }, [fromDashboard, navigateAway]);

  return (
    <View style={[styles.root(theme), { paddingTop: safeAreaInsets.top }]}>
      <UnuploadedRecordingBanner
        openRecordings={openRecordings}
        state={recordingState}
        streamingState={streamingState}
      />
      <RecordLiveView
        source={{ kind: "recorder" }}
        onBack={onBack}
        onDismiss={navigateAway}
      />
      <LocalRecordingsDialog
        isOpen={isOpenRecordings}
        close={closeRecordings}
      />
      <WebLeavePageWarning />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  }),
});
