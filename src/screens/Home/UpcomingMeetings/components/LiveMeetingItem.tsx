import { IconMoreHorizontal, IconStopCircle } from "@/assets/svg";
import { Button, LinkButton } from "@/components/Button";
import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { useStopLiveMeeting } from "@/features/live-record/useStopLiveMeeting";
import {
  GetWelcomeMeetingsDocument,
  useEndLiveMeetingCallMutation,
  type MeetingStatusData,
} from "@/graphql";
import { createStyles, vars } from "@/styles";
import { isDesktop } from "@/utils/device";
import { useApolloClient } from "@apollo/client";
import { useBooleanState } from "@/utils/states";
import { format } from "date-fns";
import { type FC } from "react";
import { Pressable, View } from "react-native";
import { WebConfButton } from "./WebConfButton";
import { openLiveDestination } from "@/features/live";

interface LiveMeetingItemProps {
  meeting: MeetingStatusData;
}

const getTimeRange = (meeting: MeetingStatusData) => {
  const startTime = format(new Date(meeting.startTime as number), "hh:mm a");
  const endTime =
    meeting.endTime && meeting.endTime !== meeting.startTime
      ? format(new Date(meeting.endTime as number), "hh:mm a")
      : null;

  if (meeting.startTime && endTime && meeting.addedBy !== "add-to-live") {
    return `${startTime} - ${endTime}`;
  }

  return startTime;
};

export const LiveMeetingItem: FC<LiveMeetingItemProps> = ({ meeting }) => {
  // meeting.userEmail is the logged in user's email
  const isHost = meeting.hostEmail === meeting.userEmail;
  const apolloClient = useApolloClient();

  const [endLiveMeetingCall, { loading: isStoppingMeeting }] =
    useEndLiveMeetingCallMutation({
      refetchQueries: [GetWelcomeMeetingsDocument],
      onCompleted() {
        toast({
          message: "Successfully ended the meeting",
          type: "success",
        });
      },
      onError(error) {
        toast({
          title: "Failed to end the meeting",
          message: error.message,
          type: "error",
        });
      },
    });

  const { stop: handleStopMeeting, isStopping } = useStopLiveMeeting({
    meetingId: meeting.objectId as string,
    addedBy: meeting.addedBy,
    endPuppetCall: () =>
      endLiveMeetingCall({
        variables: { meetingId: meeting.objectId as string },
      }),
    onStopped: async () => {
      await apolloClient.refetchQueries({
        include: [GetWelcomeMeetingsDocument],
      });
    },
  });

  const [isOpenEndMeetingDialog, openEndMeetingDialog, closeEndMeetingDialog] =
    useBooleanState();

  const isRealtimePanelEnabled = useFeatureIsOn(FEATURE_FLAGS.REALTIME_MEETING);

  const handleOpenLiveAssist = () => {
    if (isDesktop) {
      const meetingId = (meeting.objectId || meeting._id) as string;
      const liveUrl = `/live/${meetingId}?source=calendar`;
      openLiveDestination(liveUrl);
    }
  };

  return (
    <>
      <View style={styles.root}>
        <View style={styles.info}>
          <View style={styles.tagline}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Now</Text>
            </View>
            <Text variant="body2Regular" color="textMuted">
              {getTimeRange(meeting)}
            </Text>
          </View>
          <Text variant="body1Weight" color="textSecondary" numberOfLines={2}>
            {meeting.title}
          </Text>
        </View>
        <View style={styles.footer}>
          <WebConfButton url={meeting.url} />
          <View style={styles.actions}>
            {isDesktop && (
              <Button
                onPress={handleOpenLiveAssist}
                variant="transparentNeutral"
                size="xs"
                Icon={IconMoreHorizontal}
                style={styles.openLiveButton}
              >
                Live Assist
              </Button>
            )}
            {isRealtimePanelEnabled && !isDesktop && (
              <LinkButton
                href={{
                  pathname: RouteNames.Live,
                  params: {
                    id: (meeting.objectId || meeting._id) as string,
                    source: "calendar",
                  },
                }}
                variant="transparentNeutral"
                size="xs"
                Icon={IconMoreHorizontal}
                style={styles.openLiveButton}
              >
                Live Assist
              </LinkButton>
            )}
            {isHost && (
              <Pressable
                style={({ pressed }) => [
                  styles.stopButton,
                  pressed && styles.stopButtonPressed,
                ]}
                onPress={openEndMeetingDialog}
              >
                <IconStopCircle
                  width={20}
                  height={20}
                  color={vars.colors.red400}
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
      <ConfirmationDialog
        title="End meeting"
        isOpen={isOpenEndMeetingDialog}
        close={closeEndMeetingDialog}
        loading={isStoppingMeeting || isStopping}
        onConfirm={handleStopMeeting}
        variant="bottomSheet"
        confirmText="End meeting"
      >
        Are you sure you want to stop recording this meeting?
      </ConfirmationDialog>
    </>
  );
};

const styles = createStyles({
  root: {
    padding: 20,
    borderRadius: 8,
    borderColor: vars.colors.red500,
    borderWidth: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 24,
  },
  info: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  tagline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderRadius: 2,
    backgroundColor: vars.colors.red50,
  },
  tagText: {
    color: vars.colors.red700,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  stopButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: vars.colors.red50,
  },
  stopButtonPressed: {
    backgroundColor: vars.colors.red100,
  },
  openLiveButton: {
    paddingHorizontal: 16,
    borderColor: vars.colors.grey200,
    borderWidth: 1,
  },
});
