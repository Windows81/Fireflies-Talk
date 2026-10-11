import {
  LocalRecordingsDialog,
  RecordActionsContextProvider,
  UnuploadedRecordingBanner,
  useRecorder,
  WebLeavePageWarning,
} from "@/features/live-record";
import { useBooleanState } from "@/utils/states";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLayoutEffect, type FC } from "react";
import { Platform } from "react-native";
import type { ParamList } from "../types";
import { RecordView } from "./RecordView";
import { RecordLiveScreen } from "./RecordLiveScreen";
import { ScrollView } from "react-native-gesture-handler";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { isDesktop } from "@/utils/device";

// Dispatches the new record screen for mobile (RecordLiveScreen) or
// the DesktopRecordScreen based on platform.

export const RecordScreen: FC<NativeStackScreenProps<ParamList, "Record">> = (
  props,
) =>
  isDesktop ? (
    <DesktopRecordScreen {...props} />
  ) : (
    <RecordLiveScreen {...props} />
  );

/** Desktop keeps the previous Capture screen unchanged. */
const DesktopRecordScreen: FC<NativeStackScreenProps<ParamList, "Record">> = ({
  route,
}) => {
  const theme = useTheme();
  const [isOpenRecordings, openRecordings, closeRecordings] = useBooleanState();
  const fromDashboard =
    Platform.OS === "web" && theme.breakpoint !== Breakpoint.Small;
  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);

  useLayoutEffect(() => {
    if (route.params?.action === "local-recordings") {
      openRecordings();
    }
  }, [route.params?.action, openRecordings]);

  return (
    <RecordActionsContextProvider fromDashboard={fromDashboard}>
      <ScrollView
        style={styles.root(theme)}
        contentContainerStyle={styles.containerStyle}
        stickyHeaderIndices={[0]}
        overScrollMode="never"
        bounces={false}
      >
        <UnuploadedRecordingBanner
          openRecordings={openRecordings}
          state={recordingState}
          streamingState={streamingState}
        />
        <RecordView />
        <LocalRecordingsDialog
          isOpen={isOpenRecordings}
          close={closeRecordings}
        />
        <WebLeavePageWarning />
      </ScrollView>
    </RecordActionsContextProvider>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
    boxShadow: isDesktop
      ? "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)"
      : undefined,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  }),
  containerStyle: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});
