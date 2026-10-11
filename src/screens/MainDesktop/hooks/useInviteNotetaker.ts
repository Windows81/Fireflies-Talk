import { useCallback } from "react";
import { toast } from "@/components/Toast";
import { meetingDetectionApi } from "@/features/desktop-meeting-detection";
import { liveMeetingsApi, pendingAddToLiveApi } from "@/features/live";
import { useFindLanguageBest } from "@/features/remote-constants";
import {
  useCreateMeetingInMediaStorageWithUrlMutation,
  useGetCurrentUserQuery,
} from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { format } from "date-fns";

/**
 * Shared invite-notetaker logic used by the tray direct-invite path and
 * DesktopSideInvitePanel. Encapsulates the mutation, all required side
 * effects (tracking, polling refresh, detection API, pending banner), and
 * error handling so they are never duplicated.
 */
export function useInviteNotetaker(source: string, onSuccess?: () => void) {
  const { data: dataUser } = useGetCurrentUserQuery();
  const findLanguageBest = useFindLanguageBest();

  const preferredLanguage =
    (dataUser?.user?.preferredLanguage &&
      findLanguageBest(dataUser.user.preferredLanguage)?.code) ||
    "en";

  const [createMeeting, { loading }] =
    useCreateMeetingInMediaStorageWithUrlMutation({
      onCompleted({ createMeetingInMediaStorageWithURL }, options) {
        tracker.track(TRACKING_EVENTS.ADD_TOLIVE_MEETING_SUBMITTED, {
          url: options?.variables?.url,
          liveMeeting: createMeetingInMediaStorageWithURL?.meeting,
          source,
        });

        if (!createMeetingInMediaStorageWithURL?.meeting) {
          toast({
            title: "Could not add to meeting",
            message: "Something went wrong",
            type: "error",
          });
          return;
        }

        liveMeetingsApi.refetch();

        const meetingId = (
          createMeetingInMediaStorageWithURL.meeting as { meeting?: string }
        )?.meeting;
        if (meetingId)
          meetingDetectionApi.addExplicitlyInvitedMeetingId(meetingId);

        const invitedUrl = options?.variables?.url;
        if (invitedUrl) {
          pendingAddToLiveApi.add({
            id: meetingId ?? invitedUrl,
            url: invitedUrl,
            meetingId,
          });
        }

        window.electron?.notification?.show(
          "Fireflies notetaker invited",
          "The notetaker will join the meeting in few secs.",
          "",
          "",
          { showProgress: false, showCloseAlways: true, timeout: 3000 },
        );
        onSuccess?.();
      },
      onError(err) {
        toast({
          title: "Could not add to meeting",
          message: err.message,
          type: "error",
        });
      },
    });

  const invite = useCallback(
    (url: string, customLanguage?: string) => {
      createMeeting({
        variables: {
          url,
          title: format(new Date(), "MMM dd, hh:mm aa"),
          customLanguage: customLanguage ?? preferredLanguage,
        },
      });
    },
    [createMeeting, preferredLanguage],
  );

  return { invite, loading };
}
