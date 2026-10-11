import {
  FloatingSheetCard,
  FloatingSheetPanes,
} from "@/components/FloatingSheetCard";
import { LoadingScreen } from "@/components/Loading";
import { RouteNames } from "@/constants";
import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { useIsRecordSessionActive } from "@/features/live-record";
import { useManualNotesAutoUpload } from "@/features/manual-notes";
import type { MeetingStatusData } from "@/graphql";
import { RecordLiveView } from "@/screens/Record/RecordLiveView";
import { RootNavigation } from "@/screens/RootNavigation";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import {
  haptics,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from "@/utils/haptics";
import { useScreenType } from "@/utils/screen-type";
import { useQuery } from "@apollo/client";
import { GetMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useRef, useState, type FC } from "react";
import { liveMeetingsApi } from "../live-meetings.store";
import { useLiveMeetings } from "../useLiveMeetings";
import { LiveMeetingFloatingBar } from "./LiveMeetingFloatingBar";

const COMPACT_HEIGHT = 84;

/**
 * Full-width live-meeting bar docked above the bottom navigation while a
 * Fireflies-bot meeting is in progress. Tapping or dragging it up expands the
 * sheet into the unified live-meeting UI in place — the same mechanics as the
 * recording floating card (both use FloatingSheetCard), which takes precedence
 * when a recording is active.
 *
 * Three lifecycle details drive the shape of this file:
 *
 * - The card outlives its entry in the live list. It stays mounted through the
 *   exit animation, and backgrounding the app stops the poll and empties the
 *   list, so the last meeting seen is kept to render against.
 * - Ending the meeting marks it ended locally before navigating to its
 *   Notepad; an in-flight poll would otherwise redock the bar over it.
 * - Notes autosave lives in BottomSheetContent, not in the expanded pane:
 *   collapsing the sheet unmounts the pane while the draft must keep flushing.
 *   Because the card also unmounts while the meeting is still live, only a
 *   confirmed end may clear the local draft.
 *
 * Deliberately not exported from the features/live barrel: it renders
 * screens/Record, which itself imports that barrel.
 */
export const LiveMeetingFloatingCard: FC = () => {
  const theme = useTheme();
  const isRealtimePanelEnabled = useFeatureIsOn(FEATURE_FLAGS.REALTIME_MEETING);
  const { liveMeetings } = useLiveMeetings();
  const liveMeeting = liveMeetings[liveMeetings.length - 1];
  const lastLiveMeeting = useRef(liveMeeting);
  if (liveMeeting) lastLiveMeeting.current = liveMeeting;
  const shownMeeting = liveMeeting ?? lastLiveMeeting.current;
  const meetingId = (liveMeeting?.objectId as string) ?? "";

  const isRecorderBarVisible = useIsRecordSessionActive();

  const screenType = useScreenType(RouteNames.Live);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const shownMeetingId = (shownMeeting?.objectId as string) ?? "";
  const onMeetingEnded = useCallback(() => {
    haptics.notification(NotificationFeedbackType.Success);
    liveMeetingsApi.markEnded(shownMeetingId);
    bottomSheetRef.current?.collapse();
    RootNavigation.navigate(RouteNames.Notepad, { id: shownMeetingId });
    void liveMeetingsApi.refetch();
  }, [shownMeetingId]);

  const handleCollapseRequest = useCallback(() => {
    haptics.impact(ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.collapse();
  }, []);

  const isVisible =
    !!meetingId &&
    isRealtimePanelEnabled &&
    !isRecorderBarVisible &&
    screenType !== "active" &&
    theme.breakpoint !== Breakpoint.Large;

  if (!shownMeeting) return null;

  return (
    <FloatingSheetCard
      activeRoute={RouteNames.Live}
      isVisible={isVisible}
      compactHeight={COMPACT_HEIGHT}
      sheetRef={bottomSheetRef}
    >
      <BottomSheetContent
        key={shownMeetingId}
        liveMeeting={shownMeeting}
        onExpandRequest={() => bottomSheetRef.current?.snapToIndex(1)}
        onCollapseRequest={handleCollapseRequest}
        onMeetingEnded={onMeetingEnded}
      />
    </FloatingSheetCard>
  );
};

const BottomSheetContent: FC<{
  liveMeeting: MeetingStatusData;
  onExpandRequest: () => void;
  onCollapseRequest: () => void;
  onMeetingEnded: () => void;
}> = ({ liveMeeting, onExpandRequest, onCollapseRequest, onMeetingEnded }) => {
  const [hasEndSignal, setHasEndSignal] = useState(false);
  const handleMeetingEnded = useCallback(() => {
    setHasEndSignal(true);
    onMeetingEnded();
  }, [onMeetingEnded]);

  useManualNotesAutoUpload({
    meetingId: (liveMeeting.objectId as string) ?? "",
    isMeetingEnded: hasEndSignal,
    clearOnUnmount: hasEndSignal,
  });

  const { data } = useQuery(GetMeetingDocument, {
    variables: { id: liveMeeting.objectId as string },
    skip: !liveMeeting.objectId,
  });
  const meeting = data?.meeting;

  const hasTrackedOpenRef = useRef(false);
  const onExpandedChange = useCallback(
    (isExpanded: boolean) => {
      if (!isExpanded || hasTrackedOpenRef.current) return;
      hasTrackedOpenRef.current = true;
      tracker.track(TRACKING_EVENTS.LIVE_MEETING_OPENED, {
        source: "floating-card",
        addedBy: liveMeeting.addedBy,
      });
    },
    [liveMeeting.addedBy],
  );

  return (
    <FloatingSheetPanes
      compactStyle={styles.compactContent}
      compact={
        <LiveMeetingFloatingBar
          meeting={liveMeeting}
          onPress={onExpandRequest}
        />
      }
      onExpandedChange={onExpandedChange}
      renderExpanded={() =>
        meeting ? (
          <RecordLiveView
            source={{
              kind: "live-meeting",
              meeting,
              onMeetingEnded: handleMeetingEnded,
            }}
            onBack={onCollapseRequest}
            onDismiss={onCollapseRequest}
          />
        ) : (
          <LoadingScreen />
        )
      }
    />
  );
};

const styles = createStyles({
  compactContent: {
    height: 60,
    paddingBottom: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
