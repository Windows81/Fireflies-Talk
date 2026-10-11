import type { ShareDialogEmailProps } from "@/components/Share";
import { ShareDialog } from "@/components/Share";
import { toast } from "@/components/Toast";
import { Config } from "@/constants";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type {
  Playlist,
  PlaylistPrivacy,
} from "@firefliesai/bites-ff.graphql-client";
import { useUpdatePlaylistMutation } from "@firefliesai/bites-ff.graphql-client";
import { useSharePlaylistViaEmailMutation } from "@firefliesai/notifications-ff.graphql-client";
import { useCallback, useMemo, type FC } from "react";
import { PLAYLIST_PRIVACY_OPTIONS } from "../constants/privacy";

export const PlaylistShareDialog: FC<{
  playlist: Playlist;
  isOpen: boolean;
  close: () => void;
}> = ({ playlist, isOpen, close }) => {
  const { user } = useAuth();
  const { team } = useTeam();

  const [updatePlaylist, { loading: loadingUpdate }] =
    useUpdatePlaylistMutation();

  const onPrivacyChange = useCallback(
    (privacy: string) => {
      updatePlaylist({
        variables: {
          id: playlist.id,
          privacy: privacy as PlaylistPrivacy,
        },
      });
      tracker.track(TRACKING_EVENTS.PLAYLIST_PRIVACY_UPDATED, {
        id: playlist.id,
        previousPrivacy: playlist.privacy,
        privacy: privacy,
        from: "playlist-share-dialog",
      });
    },
    [playlist, updatePlaylist],
  );
  const isPlaylistOwner = playlist.userId === user?.id;

  const emails = useMemo(() => {
    return (team?.teammates?.map((t) => t?.email) || []).filter(
      Boolean,
    ) as string[];
  }, [team]);

  const profileMap = useMemo(() => {
    const o: NonNullable<ShareDialogEmailProps["profileMap"]> = {};
    team?.teammates?.forEach((t) => {
      o[t?.email as string] = {
        name: t?.name as string,
      };
    });
    return o;
  }, [team]);

  const [sharePlaylistViaEmail, { loading: loadingShare }] =
    useSharePlaylistViaEmailMutation({
      onError(err) {
        toast({
          title: "Could not share playlist",
          message: err.message,
          type: "error",
        });
      },
      onCompleted() {
        toast({
          message: "Playlist shared successfully",
          type: "success",
        });
        close();
      },
    });

  const onEmailsSubmit = useCallback(
    (selectedEmails: string[]) => {
      sharePlaylistViaEmail({
        variables: {
          playlistId: playlist.id,
          emails: selectedEmails,
        },
      });
    },
    [sharePlaylistViaEmail, playlist],
  );

  return (
    <ShareDialog
      isOpen={isOpen}
      close={close}
      title={playlist.name}
      url={`${Config.DASHBOARD_URL}/playlists/${playlist.id}?utm_source=mobile_app`}
      privacyProps={{
        value: playlist.privacy,
        onChange: onPrivacyChange,
        canChange: isPlaylistOwner,
        loading: loadingUpdate,
        options: PLAYLIST_PRIVACY_OPTIONS,
      }}
      emailProps={{
        suggestedEmails: emails,
        profileMap,
        onSubmit: onEmailsSubmit,
        loading: loadingShare,
      }}
    />
  );
};
