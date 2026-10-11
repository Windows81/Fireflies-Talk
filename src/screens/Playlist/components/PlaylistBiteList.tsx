import { imageSoundbiteMock, imageSoundbiteMockDark } from "@/assets/images";
import {
  BiteListItem,
  LoadingBiteListItem,
  UnavailbleBiteListItem,
} from "@/components/Bite";
import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { MessageView } from "@/components/Message";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import { BiteBottomSheetMenu } from "@/features/bite";
import type { Playlist } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

const PlaylistBiteListItem: FC<{
  bite: Soundbite | undefined;
  playlist: Playlist;
  index: number;
}> = ({ bite, playlist, index }) => {
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState(false);

  return (
    <>
      {bite ? (
        <LinkView
          href={{
            pathname: RouteNames.Bite,
            params: { id: bite.id, playlist: playlist.id, index },
          }}
          onLongPress={openMenu}
        >
          <BiteListItem bite={bite} />
        </LinkView>
      ) : (
        <UnavailbleBiteListItem />
      )}
      {bite && (
        <BiteBottomSheetMenu
          bite={bite}
          isOpen={isOpenMenu}
          close={closeMenu}
          fromRef="playlist-screen/bite-list"
        />
      )}
    </>
  );
};

export const PlaylistBiteList: FC<{
  playlist: Playlist;
  openAdd: () => void;
  loading: boolean;
}> = ({ playlist, openAdd, loading }) => {
  const { user } = useAuth();

  const isOwner = user?.id === playlist.userId;

  if (!playlist.biteIds?.length) {
    return (
      <MessageView
        headerImage={imageSoundbiteMock}
        headerImageDark={imageSoundbiteMockDark}
        title={
          isOwner ? "Add soundbites to your playlist" : "This playlist is empty"
        }
        description="Playlists helps you keep your favourite soundbites organized and easily sharable."
        action={
          isOwner ? <Button onPress={openAdd}>Add Soundbites</Button> : null
        }
      />
    );
  }

  const bites = playlist.bites;

  return (
    <View style={styles.list}>
      {bites ? (
        playlist.biteIds?.map((biteId, index) => {
          const bite = bites.find((b) => b.id === biteId);
          return (
            <PlaylistBiteListItem
              key={biteId}
              bite={bite}
              playlist={playlist}
              index={index}
            />
          );
        })
      ) : loading ? (
        <>
          {Array(playlist.count || 3)
            .fill(null)
            .map((_, index) => (
              <LoadingBiteListItem key={index} />
            ))}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    zIndex: 1,
  },
});
