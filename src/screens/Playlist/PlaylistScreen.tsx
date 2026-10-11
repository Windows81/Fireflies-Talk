import { IconLock } from "@/assets/svg";
import { ErrorScreen, NotFoundScreen } from "@/components/Error";
import { isForbiddenError, shouldRetryError } from "@/errors";
import { openLoginPopup, useAuth, useShowDynamicLogin } from "@/features/auth";
import {
  PlaylistBottomSheetMenu,
  PlaylistShareDialog,
} from "@/features/playlist";
import type { Playlist } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { useGetPlaylistQuery } from "@firefliesai/bites-ff.graphql-client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import { useLayoutEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import type { ParamList } from "../types";
import { AddBitesDialog } from "./components/AddBitesDialog";
import { HeaderRight } from "./components/Header";
import { PlaylistBiteList } from "./components/PlaylistBiteList";
import {
  HEADER_HEIGHT,
  PlaylistHeader,
  PlaylistHeaderSkeleton,
} from "./components/PlaylistHeader";

const PlaylistScreenContent: FC<{
  playlist: Playlist;
  navigation: NativeStackScreenProps<ParamList, "Playlist">["navigation"];
  loading: boolean;
}> = ({ playlist, navigation, loading }) => {
  const [isOpenShare, openShare, closeShare] = useBooleanState();
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState();
  const [isOpenAdd, openAdd, closeAdd] = useBooleanState();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight() {
        return (
          <HeaderRight
            openShare={openShare}
            openMenu={openMenu}
            openAdd={openAdd}
            playlist={playlist}
          />
        );
      },
    });
  }, [openShare, openMenu, openAdd, playlist, navigation]);

  const animY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    animY.value = event.contentOffset.y;
  });

  return (
    <>
      <Animated.ScrollView
        style={styles.root}
        onScroll={scrollHandler}
        contentContainerStyle={styles.content}
      >
        <PlaylistHeader playlist={playlist} animY={animY} />
        <PlaylistBiteList
          playlist={playlist}
          openAdd={openAdd}
          loading={loading}
        />
      </Animated.ScrollView>
      <PlaylistShareDialog
        playlist={playlist}
        isOpen={isOpenShare}
        close={closeShare}
      />
      <PlaylistBottomSheetMenu
        playlist={playlist}
        isOpen={isOpenMenu}
        close={closeMenu}
        onDelete={() => navigation.goBack()}
      />
      <AddBitesDialog playlist={playlist} isOpen={isOpenAdd} close={closeAdd} />
    </>
  );
};

const LoadingPlaylistScreen: FC = () => {
  return (
    <View style={styles.root}>
      <PlaylistHeaderSkeleton />
    </View>
  );
};

export const PlaylistScreen: FC<
  NativeStackScreenProps<ParamList, "Playlist">
> = ({ route, navigation }) => {
  const { user } = useAuth();

  const { data, error, loading, refetch } = useGetPlaylistQuery({
    variables: {
      id: route.params.id,
    },
    returnPartialData: true,
    notifyOnNetworkStatusChange: true,
  });

  useShowDynamicLogin("playlist/auto-show");

  if (!data?.playlist?.id && loading) return <LoadingPlaylistScreen />;

  // returnPartialData returns empty object {} even if no data
  if (!data?.playlist?.id && error) {
    if (isForbiddenError(error?.graphQLErrors?.[0] || error)) {
      if (!user) {
        return (
          <ErrorScreen
            login={() => openLoginPopup("playlist")}
            Icon={IconLock}
            title="This playlist is private"
            description="Login to check your playlist access"
          />
        );
      }

      return (
        <ErrorScreen
          Icon={IconLock}
          title="You do not have permission to view this playlist"
          description="Request the playlist owner for access"
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

  if (!data?.playlist)
    return (
      <NotFoundScreen
        title="Playlist not found"
        description="It does not exist or you do not have access"
      />
    );

  return (
    <PlaylistScreenContent
      playlist={data.playlist}
      navigation={navigation}
      loading={loading}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: HEADER_HEIGHT / 2,
  },
});
