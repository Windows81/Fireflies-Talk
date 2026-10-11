import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { SelectField, TextField } from "@/components/Input";
import { toast } from "@/components/Toast";
import { RouteNames } from "@/constants";
import { openLoginPopup, useAuth } from "@/features/auth";
import { PLAYLIST_PRIVACY_OPTIONS } from "@/features/playlist";
import { RootNavigation } from "@/screens/RootNavigation";
import { createStyles } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import {
  GetPlaylistsDocument,
  PlaylistPrivacy,
  useCreatePlaylistMutation,
} from "@firefliesai/bites-ff.graphql-client";
import { useState, type FC } from "react";
import { View } from "react-native";
import { globalModalsApi } from "../global-modals.store";

const CreatePlaylistDialogContent: FC<{
  close: () => void;
  initialBiteIds?: string[];
  onCreated?: (playlist: Playlist) => void;
}> = ({ close, initialBiteIds, onCreated }) => {
  const [name, setName] = useState("");
  const [privacy, setPrivacy] = useState<PlaylistPrivacy>(
    PlaylistPrivacy.Public,
  );

  const [createPlaylist] = useCreatePlaylistMutation({
    refetchQueries: [GetPlaylistsDocument],
    variables: {
      name,
      biteIds: initialBiteIds || [],
      privacy,
    },
    onCompleted(data) {
      toast({
        message: "Playlist created",
        type: "success",
        action: {
          label: "View",
          onPress() {
            RootNavigation.navigate(RouteNames.Playlist, {
              id: data.createPlaylist.id,
            });
          },
        },
      });
      onCreated?.(data.createPlaylist);
    },
    onError(err) {
      toast({
        title: "Could not create playlist",
        message: err.message,
        type: "error",
      });
    },
  });

  const { user } = useAuth();

  const doCreatePlaylist = () => {
    if (!user) {
      openLoginPopup("create-playlist");
      return;
    }
    createPlaylist();
    close();
  };

  return (
    <>
      <View style={styles.root}>
        <TextField
          label="Name"
          value={name}
          onValueChange={setName}
          placeholder="Playlist name"
        />
        <SelectField
          label="Privacy"
          value={privacy}
          options={PLAYLIST_PRIVACY_OPTIONS}
          onValueChange={setPrivacy}
        />
        <Button disabled={!name.trim()} onPress={doCreatePlaylist}>
          Create
        </Button>
      </View>
    </>
  );
};

export const CREATE_PLAYLIST_MODAL_NAME = "create-playlist";

interface CreatePlaylistModalProps {
  initialBiteIds?: string[];
  onCreated?: (playlist: Playlist) => void;
}

export const CreatePlaylistDialog: FC<
  {
    isOpen: boolean;
    close: () => void;
  } & CreatePlaylistModalProps
> = ({ isOpen, close, initialBiteIds, onCreated }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close}>
      <Dialog.Header>New playlist</Dialog.Header>
      <CreatePlaylistDialogContent
        close={close}
        initialBiteIds={initialBiteIds}
        onCreated={onCreated}
      />
    </Dialog.Root>
  );
};

export const openCreatePlaylistModal = ({
  fromRef,
  ...props
}: {
  fromRef: string;
} & CreatePlaylistModalProps) => {
  globalModalsApi.openModal(CREATE_PLAYLIST_MODAL_NAME, props);
  tracker.track(TRACKING_EVENTS.PLAYLIST_CREATE_MODAL_OPENED, {
    from: fromRef,
  });
};

const styles = createStyles({
  root: {
    padding: 16,
    gap: 16,
  },
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  privacyCurrent: {
    alignItems: "flex-start",
    flex: 1,
  },
  formControl: {
    gap: 8,
  },
});
