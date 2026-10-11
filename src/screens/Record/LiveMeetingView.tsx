import { RouteNames } from "@/constants";
import { isLiveMeeting, liveMeetingsApi } from "@/features/live";
import { useManualNotesAutoUpload } from "@/features/manual-notes";
import { createStyles, useTheme } from "@/styles";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useCallback, useEffect, useState, type FC } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import { RecordLiveView } from "./RecordLiveView";

/**
 * Mobile viewer for an in-progress Fireflies-bot meeting: the unified
 * recording UI in live-meeting mode (realtime transcript + notes + AskFred).
 * Once the meeting ends it redirects to the meeting's Notepad.
 */
export const LiveMeetingView: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ParamList>>();

  const [hasEndSignal, setHasEndSignal] = useState(false);
  const isMeetingEnded = hasEndSignal || !isLiveMeeting(meeting);
  const onMeetingEnded = useCallback(() => setHasEndSignal(true), []);

  // Back mid-meeting must not drop the draft: the viewer is expected to come
  // back to it. Only an ended meeting has finished with its notes.
  useManualNotesAutoUpload({
    meetingId: meeting.id,
    isMeetingEnded,
    clearOnUnmount: isMeetingEnded,
  });

  useEffect(() => {
    if (!isMeetingEnded) return;
    // Before navigating: an in-flight poll would otherwise redock the bar.
    liveMeetingsApi.markEnded(meeting.id);
    navigation.replace(RouteNames.Notepad, { id: meeting.id });
  }, [isMeetingEnded, meeting.id, navigation]);

  const onBack = useCallback(() => {
    // Cold-start deep links can make Live the stack root.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(RouteNames.Main);
    }
  }, [navigation]);

  return (
    <View style={[styles.root(theme), { paddingTop: safeAreaInsets.top }]}>
      <RecordLiveView
        source={{ kind: "live-meeting", meeting, onMeetingEnded }}
        onBack={onBack}
        onDismiss={onBack}
      />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  }),
});
