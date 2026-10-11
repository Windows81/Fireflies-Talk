import { imageSoundbiteMock, imageSoundbiteMockDark } from "@/assets/images";
import { IconSearch } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { TextInput } from "@/components/Input";
import { MessageView } from "@/components/Message";
import {
  LoadingPlaylistListItem,
  PlaylistListItem,
} from "@/components/Playlist";
import { QueryListView } from "@/components/QueryListView";
import { toast } from "@/components/Toast";
import { openLoginPopup, useAuth } from "@/features/auth";
import { createStyles, useTheme } from "@/styles";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import {
  useGetPlaylistsQuery,
  useUpdatePlaylistBitesMutation,
  type Soundbite,
} from "@firefliesai/bites-ff.graphql-client";
import type { ListRenderItem } from "@shopify/flash-list";
import { useCallback, useMemo, useState, type FC } from "react";
import { TouchableHighlight, View } from "react-native";
import { openCreatePlaylistModal } from "../create-playlist-modal/CreatePlaylistModal";
import { globalModalsApi } from "../global-modals.store";

const AddToExistingPlaylist: FC<{
  bite: Soundbite;
  close: () => void;
}> = ({ bite, close }) => {
  const [search, setSearch] = useState("");
  const theme = useTheme();

  const { data, loading, error, refetch } = useGetPlaylistsQuery({
    variables: {
      mine: true,
    },
    errorPolicy: "all",
    onError(err) {
      toast({
        title: "Could not load playlists",
        message: err.message,
        type: "error",
      });
    },
    notifyOnNetworkStatusChange: true,
  });

  const playlists = useMemo(() => {
    if (!data?.playlists) return [];
    if (!search) return data.playlists;
    return data.playlists.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, data]);

  const [updatePlaylist] = useUpdatePlaylistBitesMutation({
    onCompleted({ updatePlaylistBites }) {
      toast({
        message: `Added to ${updatePlaylistBites.name}`,
        type: "success",
      });
    },
    onError(err) {
      toast({
        title: "Could not add to playlist",
        message: err.message,
        type: "error",
      });
    },
  });

  const addToPlaylist = useCallback(
    (playlist: Playlist) => {
      if (playlist.biteIds?.includes(bite.id)) {
        toast({
          message: "This playlist already contains this soundbite",
        });
        return;
      }
      updatePlaylist({
        variables: {
          id: playlist.id,
          adding: [bite.id],
        },
      });
      close();
    },
    [bite, close, updatePlaylist],
  );

  const renderItem = useCallback<ListRenderItem<Playlist>>(
    ({ item }) => {
      return (
        <TouchableHighlight
          activeOpacity={1}
          underlayColor={theme.colors.layerMuted}
          onPress={() => addToPlaylist(item)}
          role="button"
        >
          <PlaylistListItem playlist={item} />
        </TouchableHighlight>
      );
    },
    [theme, addToPlaylist],
  );

  return (
    <View style={styles.addExisting}>
      <View style={styles.container}>
        <TextInput
          value={search}
          onValueChange={setSearch}
          clearable
          Icon={IconSearch}
          placeholder="Find playlist"
          style={styles.searchInput}
        />
      </View>
      <QueryListView
        data={playlists}
        renderItem={renderItem}
        refetch={refetch}
        LoadingItemComponent={LoadingPlaylistListItem}
        emptyState={
          search ? (
            <MessageView
              title="No playlists found"
              description="Try searching for something else"
            />
          ) : (
            <MessageView
              title="No playlists created"
              description="Create a playlist to add this soundbite"
            />
          )
        }
        errorStateTitle="Could not load playlists"
        loading={loading}
        error={error}
      />
    </View>
  );
};

const AddBiteToPlaylistDialogContent: FC<{
  bite: Soundbite;
  close: () => void;
  fromRef?: string;
}> = ({ bite, close, fromRef }) => {
  const openCreate = useCallback(() => {
    openCreatePlaylistModal({
      fromRef: `${fromRef ? `${fromRef}/` : ""}add-to-playlist`,
      initialBiteIds: [bite.id],
    });
  }, [bite.id, fromRef]);

  const { user } = useAuth();

  if (!user) {
    return (
      <MessageView
        headerImage={imageSoundbiteMock}
        headerImageDark={imageSoundbiteMockDark}
        title="Sign in to add this soundbite to a playlist"
        description="You need to be signed in to add to a playlist"
        action={
          <Button onPress={() => openLoginPopup("add-to-playlist")}>
            Sign in
          </Button>
        }
      />
    );
  }

  return (
    <>
      <View style={styles.root}>
        <Button
          size="lg"
          variant="secondary"
          style={styles.newButton}
          onPress={() => {
            close();
            openCreate();
          }}
        >
          New playlist
        </Button>
        <AddToExistingPlaylist bite={bite} close={close} />
      </View>
    </>
  );
};

export const ADD_TO_PLAYLIST_MODAL_NAME = "add-to-playlist";

interface AddToPlaylistModalProps {
  bite: Soundbite;
  fromRef?: string;
}

export const AddToPlaylistDialog: FC<
  {
    isOpen: boolean;
    close: () => void;
  } & AddToPlaylistModalProps
> = ({ bite, isOpen, close, fromRef }) => {
  return (
    <>
      <Dialog.Root isOpen={isOpen} close={close} variant="fullscreen">
        <Dialog.Header>Add to playlist</Dialog.Header>
        <AddBiteToPlaylistDialogContent
          bite={bite}
          close={close}
          fromRef={fromRef}
        />
      </Dialog.Root>
    </>
  );
};

export const openAddToPlaylistModal = ({
  fromRef,
  ...props
}: AddToPlaylistModalProps) => {
  globalModalsApi.openModal(ADD_TO_PLAYLIST_MODAL_NAME, {
    ...props,
    fromRef,
  });
};

const styles = createStyles({
  root: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  newButton: {
    borderRadius: 9999,
  },
  addExisting: {
    flex: 1,
    width: "100%",
    gap: 8,
  },
  searchInput: {
    width: "100%",
  },
  container: {
    width: "100%",
    paddingHorizontal: 16,
  },
});
