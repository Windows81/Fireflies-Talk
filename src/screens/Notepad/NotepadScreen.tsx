import { IconLock } from "@/assets/svg";
import { ErrorScreen, NotFoundScreen } from "@/components/Error";
import { isForbiddenError, isNotFoundError, shouldRetryError } from "@/errors";
import { openLoginPopup, useAuth, useShowDynamicLogin } from "@/features/auth";
import {
  deleteDownload,
  useDownloadedMeetingPayload,
} from "@/features/downloads";
import { DEMO_MEETING_IDS } from "@/features/meeting";
import { PlayerProvider } from "@/features/player";
import { useRemoteConstants } from "@/features/remote-constants";
import { useFetchIsGuestAccessEnabledQuery } from "@/graphql";
import { toSecFromHHMMSS } from "@/utils/time";
import { useQuery } from "@apollo/client";
import {
  GetMeetingDocument,
  GetMeetingSummaryQueryDocument,
} from "@firefliesai/mobile-ff.graphql-client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNetworkState } from "@/utils/network";
import { useEffect, useState, type FC } from "react";
import { InteractionManager } from "react-native";
import type { ParamList } from "../types";
import {
  NotepadScreenContent,
  NotepadScreenContentLoading,
} from "./NotepadScreenContent";

export const NotepadScreen: FC<
  NativeStackScreenProps<ParamList, "Notepad">
> = ({ route, navigation }) => {
  const { user } = useAuth();
  const { DEMO_MEETING_ID } = useRemoteConstants();

  // The Apollo cache (warmed by the downloads reconciler) can serve the full
  // meeting synchronously at tap time; mounting the heavy content mid-push
  // starves the JS thread, so the skeleton holds until the transition settles.
  const [interactionsDone, setInteractionsDone] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsDone(true);
    });
    return () => task.cancel();
  }, []);

  const meetingId = DEMO_MEETING_IDS.includes(route.params.id)
    ? DEMO_MEETING_ID
    : route.params.id;

  const { data: isGuestAccessEnabledData } = useFetchIsGuestAccessEnabledQuery({
    variables: {
      meetingNoteId: meetingId,
    },
    skip: !!user,
  });
  useShowDynamicLogin(
    "notepad/auto-show",
    isGuestAccessEnabledData?.meetingNote?.isGuestAccessEnabled,
  );

  const { data, error, loading, refetch } = useQuery(GetMeetingDocument, {
    variables: {
      id: meetingId,
    },
    notifyOnNetworkStatusChange: true,
  });

  // preload meeting summary
  useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId },
    errorPolicy: "ignore",
    fetchPolicy: "cache-and-network",
  });

  const { payload, mediaFileType, localMediaUri } =
    useDownloadedMeetingPayload(meetingId);
  const networkState = useNetworkState();

  const downloadedMeeting = payload?.meeting;
  const hasDownload = !!downloadedMeeting;

  // Access revoked online: the server answered forbidden/not-found while a
  // download exists — drop the local copy. Network errors keep the download.
  useEffect(() => {
    if (!user || !hasDownload || loading) return;
    if (error) {
      if (error.networkError) return;
      const cause = error.graphQLErrors?.[0] || error;
      if (isForbiddenError(cause) || isNotFoundError(cause)) {
        deleteDownload(meetingId);
      }
    } else if (data && !data.meeting) {
      deleteDownload(meetingId);
    }
  }, [user, hasDownload, loading, error, data, meetingId]);

  // signed URLs stored at download time may be expired — local file or nothing
  const localMedia = {
    video_url: mediaFileType === "video" ? localMediaUri : null,
    audio_url: mediaFileType === "audio" ? localMediaUri : null,
  };

  // downloaded media beats streaming when online: same bytes, zero bandwidth
  const serverMeeting = data?.meeting
    ? {
        ...data.meeting,
        video_url: localMedia.video_url ?? data.meeting.video_url,
        audio_url: localMedia.audio_url ?? data.meeting.audio_url,
      }
    : undefined;

  // the local copy renders instantly while the fresh payload loads and covers
  // network errors — a GraphQL/permission error must never be masked by it
  const offlineMeeting =
    downloadedMeeting &&
    (loading ||
      error?.networkError ||
      networkState.isInternetReachable === false)
      ? { ...downloadedMeeting, ...localMedia }
      : undefined;
  const meeting = serverMeeting ?? offlineMeeting;

  if (!meeting && loading) {
    return <NotepadScreenContentLoading />;
  }

  if (!meeting && error) {
    if (isForbiddenError(error?.graphQLErrors?.[0] || error)) {
      if (!user) {
        return (
          <ErrorScreen
            login={() => openLoginPopup("notepad")}
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

  // TODO
  if (!meeting) {
    return (
      <NotFoundScreen
        title="Meeting not found"
        description="It does not exist or you do not have access"
      />
    );
  }

  if (!interactionsDone) {
    return <NotepadScreenContentLoading />;
  }

  const initialTime = route.params.t
    ? toSecFromHHMMSS(route.params.t)
    : undefined;

  return (
    <PlayerProvider>
      <NotepadScreenContent
        meeting={meeting}
        initialTime={initialTime}
        navigation={navigation}
      />
    </PlayerProvider>
  );
};
