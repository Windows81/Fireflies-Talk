import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { MeetingAddedByIcon } from "@/components/Meeting";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import {
  COMPUTED_MEETING_STATUS,
  MEETING_PUPPET_STATUS,
  MEETING_STATUS_CANCELLED,
  PROCESS_MEETING_STATUS,
  RouteNames,
} from "@/constants";
import { isLiveMeeting } from "@/features/live";
import { useStopLiveMeeting } from "@/features/live-record/useStopLiveMeeting";
import type { MeetingStatusData } from "@/graphql";
import {
  useEndLiveMeetingCallMutation,
  useReloadMeetingCallLazyQuery,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { format } from "date-fns";
import { useMemo, type FC } from "react";
import { View } from "react-native";

const now = new Date();

const PROCESS_STATUS_BY_COMPUTED_STATUS: Partial<
  Record<COMPUTED_MEETING_STATUS, PROCESS_MEETING_STATUS>
> = {
  [COMPUTED_MEETING_STATUS.PROCESSING]: PROCESS_MEETING_STATUS.STARTED,
  [COMPUTED_MEETING_STATUS.COMPLETED]: PROCESS_MEETING_STATUS.COMPLETED,
  [COMPUTED_MEETING_STATUS.FAILED]: PROCESS_MEETING_STATUS.FAILED,
  [COMPUTED_MEETING_STATUS.CONNECTION_FAILED]: PROCESS_MEETING_STATUS.FAILED,
};

// `computedStatus` is computed server side and covers pipeline failures that never
// reach `processMeetingStatus`; the raw field stays as a fallback for payloads without it
const getProcessStatus = (meeting: MeetingStatusData) =>
  (meeting.computedStatus &&
    PROCESS_STATUS_BY_COMPUTED_STATUS[
      meeting.computedStatus as COMPUTED_MEETING_STATUS
    ]) ||
  meeting.processMeetingStatus;

export const MeetingStatusListItem: FC<{ meeting: MeetingStatusData }> = ({
  meeting,
}) => {
  const theme = useTheme();

  const startTime = meeting.startTime ? new Date(meeting.startTime) : null;
  const isSameYear = startTime?.getFullYear() === now.getFullYear();

  const message = useMemo<{
    content: string | null | undefined;
    color: keyof typeof theme.colors;
  }>(() => {
    if (meeting.audioIsTooSmall) {
      return {
        content: "Meeting audio is too short to process",
        color: "informationStaticYellowText",
      };
    }

    switch (meeting.status) {
      case MEETING_PUPPET_STATUS.STARTED: {
        return {
          content: meeting.message,
          color: "informationStaticGreenText",
        };
      }
      case MEETING_PUPPET_STATUS.ACTIVE: {
        // onging meeting
        return {
          content: meeting.message,
          color: "textBrand",
        };
      }
      case MEETING_PUPPET_STATUS.PROCESSING: {
        return {
          content: meeting.message,
          color: "textBrand",
        };
      }
      case MEETING_PUPPET_STATUS.CONNECT_FAIL: {
        return {
          content: meeting.message,
          color: "informationStaticRedText",
        };
      }
      case MEETING_PUPPET_STATUS.ENDED: {
        // usually the process status is only available after puppet status === ended
        const processStatus = getProcessStatus(meeting);
        if (processStatus === PROCESS_MEETING_STATUS.COMPLETED) {
          return {
            content: meeting.message,
            color: "informationStaticGreenText",
          };
        }
        if (processStatus === PROCESS_MEETING_STATUS.STARTED) {
          return {
            content: "Processing...",
            color: "textBrand",
          };
        }
        if (processStatus === PROCESS_MEETING_STATUS.NOT_STARTED) {
          return {
            content: "Processing...",
            color: "textBrand",
          };
        }
        if (processStatus === PROCESS_MEETING_STATUS.FAILED) {
          return {
            content: meeting.message,
            color: "informationStaticRedText",
          };
        }
        return {
          content: "Processing...",
          color: "textBrand",
        };
      }
      case MEETING_PUPPET_STATUS.FAILED: {
        return {
          content: meeting.message,
          color: "informationStaticRedText",
        };
      }
      case MEETING_PUPPET_STATUS.DELAYED: {
        return {
          content: meeting.message,
          color: "informationStaticYellowText",
        };
      }
      case MEETING_STATUS_CANCELLED: {
        return {
          content: meeting.message || "Meeting cancelled",
          color: "informationStaticRedText",
        };
      }
    }
    return {
      content: meeting.message,
      color: "textSecondary",
    };
  }, [meeting]);

  const href = useMemo(() => {
    if (
      !(
        getProcessStatus(meeting) === PROCESS_MEETING_STATUS.COMPLETED &&
        meeting.openNotebook &&
        meeting.objectId
      )
    )
      return undefined;

    return {
      pathname: RouteNames.Notepad,
      params: {
        id: meeting.objectId,
      },
    };
  }, [meeting]);

  const [
    endLiveMeetingCall,
    { loading: endLiveMeetingCallLoading, data: endLiveMeetingCallData },
  ] = useEndLiveMeetingCallMutation({
    variables: {
      meetingId: meeting.objectId as string,
    },
    onCompleted() {
      toast({
        message: "Your meeting recording will not be processed.",
        type: "success",
      });
    },
    onError(err) {
      toast({
        title: "Could not stop remove Fred from meeting",
        message: err.message,
        type: "error",
      });
    },
  });

  const {
    stop: handleStopMeeting,
    isStopping,
    hasStopped,
  } = useStopLiveMeeting({
    meetingId: meeting.objectId as string,
    addedBy: meeting.addedBy,
    endPuppetCall: () => endLiveMeetingCall(),
  });

  const [
    reloadMeetingCall,
    { loading: reloadMeetingCallLoading, data: reloadMeetingCallData },
    // TODO: why is this a query and not a mutation?
  ] = useReloadMeetingCallLazyQuery({
    variables: {
      meetingId: meeting.objectId as string,
    },
    onCompleted() {
      toast({
        message: "Your meeting is being reprocessed",
        type: "success",
      });
    },
    onError(err) {
      toast({
        title: "Could not reprocess meeting",
        message: err.message,
        type: "error",
      });
    },
  });

  const node = (
    <View style={styles.itemContent}>
      <View style={styles.itemTitle}>
        <Text variant="title3Weight">{meeting.title}</Text>
        <MeetingAddedByIcon meeting={meeting} iconOnly />
      </View>
      <View style={styles.itemMeta}>
        {startTime && (
          <Text color="textMuted">
            {format(startTime, isSameYear ? "MMM d" : "MMM d, yyyy")} ·{" "}
            {format(startTime, "h:mm a")}
          </Text>
        )}
      </View>
      <Text color={message.color}>{message.content}</Text>
      <View style={styles.itemStatus}>{}</View>
    </View>
  );

  return (
    <View style={styles.item(theme)}>
      {href ? (
        <LinkView href={href} style={styles.itemContentTouchable} animated>
          {node}
        </LinkView>
      ) : (
        <View style={styles.itemContentTouchable}>{node}</View>
      )}
      {isLiveMeeting(meeting) && (
        <Button
          variant="outlined"
          size="xs"
          disabled={
            endLiveMeetingCallLoading ||
            !!endLiveMeetingCallData?.endLiveMeetingCall ||
            isStopping ||
            hasStopped
          }
          onPress={handleStopMeeting}
        >
          {endLiveMeetingCallData?.endLiveMeetingCall || hasStopped
            ? "Stopped capturing"
            : "Stop capturing"}
        </Button>
      )}
      {meeting.reloadMeeting && !meeting.audioIsTooSmall && (
        <Button
          variant="outlined"
          size="xs"
          disabled={
            reloadMeetingCallLoading ||
            !!reloadMeetingCallData?.reloadMeetingCall
          }
          onPress={() => reloadMeetingCall()}
        >
          {reloadMeetingCallData?.reloadMeetingCall
            ? "Reprocessing"
            : "Reprocess"}
        </Button>
      )}
    </View>
  );
};

const styles = createStyles({
  item: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderColor: theme.colors.borderStaticSubtle,
    borderTopWidth: 1,
  }),
  itemContentTouchable: {
    flex: 1,
  },
  itemContent: {
    gap: 4,
  },
  itemTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
