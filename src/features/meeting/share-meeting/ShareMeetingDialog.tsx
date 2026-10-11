import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { useAuth } from "@/features/auth";
import type { FindUsersMeetingIsSharedWithResponse } from "@/graphql";
import { useFindUsersMeetingIsSharedWithQuery, type Meeting } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isDesktop } from "@/utils/device";
import { shareUrl } from "@/utils/share";
import { format, isSameYear } from "date-fns";
import { useState, type FC } from "react";
import { Platform, View } from "react-native";
import { ShareMeetingDialogEmail } from "./ShareMeetingDialogEmail";
import { ShareMeetingDialogEmailAddingContent } from "./ShareMeetingDialogEmailAdding";
import { ShareMeetingDialogPrivacy } from "./ShareMeetingDialogPrivacy";
import { useQuery } from "@apollo/client";
import { GetMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";

const ShareMeetingDialogContent: FC<{
  meeting: Meeting;
  close: () => void;
  setIsOpenAdd: (isOpen: boolean) => void;
  findUsersMeetingIsSharedWith:
    | FindUsersMeetingIsSharedWithResponse
    | undefined
    | null;
  loading?: boolean;
}> = ({ meeting, setIsOpenAdd, findUsersMeetingIsSharedWith, loading }) => {
  const theme = useTheme();

  const url = `${Config.DASHBOARD_URL}/view/${meeting.id}`;
  const title = meeting.title;

  const { user } = useAuth();

  const isInSameYear = isSameYear(meeting.startTime ?? 0, new Date());
  const dateFormat = isInSameYear
    ? "E, MMM d · h:mm a"
    : "E, MMM d, yyyy · h:mm a";

  return (
    <>
      <Dialog.Header>
        {isDesktop ? (
          <View style={styles.meetingInfo}>
            <View style={styles.titleRow}>
              <Text variant="body2Weight" color="textPrimary" numberOfLines={1}>
                {meeting.title}
              </Text>
            </View>
            {meeting.startTime && (
              <View style={styles.dateRow}>
                {meeting.organizer?.name && (
                  <Text variant="body3Regular" color="textMuted">
                    {`${meeting.organizer?.name} · `}
                  </Text>
                )}
                <Text variant="body3Regular" color="textMuted">
                  {format(meeting.startTime, dateFormat)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          "Share meeting"
        )}
      </Dialog.Header>
      {!!user && (
        <ShareMeetingDialogEmail
          meeting={meeting}
          setIsOpenAdd={setIsOpenAdd}
          findUsersMeetingIsSharedWith={findUsersMeetingIsSharedWith}
          loading={loading}
        />
      )}
      <View style={styles.footer(theme)}>
        <ShareMeetingDialogPrivacy meeting={meeting} />
        <Button
          onPress={() => {
            shareUrl(url, title);
            tracker.track(TRACKING_EVENTS.SHARE_LINK_BUTTON_CLICKED, {
              url: url,
              privacy: meeting.notesPrivacy,
              type: "meeting",
            });
          }}
        >
          {Platform.OS === "web" ? "Copy meeting url" : "Share page link"}
        </Button>
      </View>
    </>
  );
};

export const ShareMeetingDialog: FC<{
  meetingId: string;
  meeting?: Meeting;
  isOpen: boolean;
  close: () => void;
}> = ({ meetingId, meeting: cachedMeeting, isOpen, close }) => {
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  const { user } = useAuth();

  const { data: meetingData } = useQuery(GetMeetingDocument, {
    variables: {
      id: meetingId,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    skip: !isOpen || !user || !!cachedMeeting,
  });

  const { data, loading } = useFindUsersMeetingIsSharedWithQuery({
    variables: { meetingId },
    skip: !isOpen || !user,
  });

  const meeting = cachedMeeting ?? meetingData?.meeting;

  if (!isOpen || !meeting) return null;

  return (
    <Dialog.Root
      isOpen={isOpen || isOpenAdd}
      close={close}
      variant="fullscreen"
    >
      <ShareMeetingDialogContent
        meeting={meeting}
        close={close}
        setIsOpenAdd={setIsOpenAdd}
        findUsersMeetingIsSharedWith={data?.findUsersMeetingIsSharedWith}
        loading={loading}
      />

      <Dialog.Root
        isOpen={isOpenAdd}
        close={() => setIsOpenAdd(false)}
        portalHostname="ShareDialogPortalHost"
        variant="fullscreen"
      >
        <ShareMeetingDialogEmailAddingContent
          meeting={meeting}
          close={() => setIsOpenAdd(false)}
          findUsersMeetingIsSharedWith={data?.findUsersMeetingIsSharedWith}
        />
      </Dialog.Root>
    </Dialog.Root>
  );
};

const styles = createStyles({
  footer: (theme) => ({
    padding: 24,
    backgroundColor: theme.colors.layerSubtle,
    gap: 20,
  }),
  meetingInfo: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
