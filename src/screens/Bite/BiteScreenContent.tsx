import { LoadingScreen } from "@/components/Loading";
import { openLoginPopup, useAuth } from "@/features/auth";
import { BiteBottomSheetMenu, BiteShareDialog } from "@/features/bite";
import {
  PlayerComponent,
  PlayerComponentContainer,
  usePlayer,
} from "@/features/player";
import type { Soundbite } from "@/graphql";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import { BiteScreenDesktopSide } from "./BiteScreenDesktopComponents";
import { BiteScreenMobileTabs } from "./BiteScreenMobileComponents";
import { BiteSummary } from "./Summary/BiteSummary";
import { BiteMetadata, LoadingBiteMetadata } from "./components/BiteMetadata";
import { HeaderRight } from "./components/Header";
import {
  PlaylistQueue,
  PlaylistQueueBottomBar,
} from "./components/PlaylistQueue";

export const BiteScreenContent: FC<{
  bite: Soundbite;
  playlist?: Playlist;
  index?: number;
  navigation: NativeStackScreenProps<ParamList, "Bite">["navigation"];
  initialTime?: number;
  loading: boolean;
}> = ({ bite, playlist, index, initialTime, navigation, loading }) => {
  const { player, setOptions } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    if (!bite.sources) return;
    setOptions({
      sources: bite.sources || [],
      metadata: {
        title: bite.name,
        duration: bite.endTime - bite.startTime,
        artist: bite.user?.name,
        album: playlist?.name || bite.createdFrom?.name,
        artwork: bite.thumbnail || undefined,
      },
      initialTime,
      mediaKey: bite.id,
    });
  }, [bite, playlist, setOptions, initialTime]);

  useEffect(() => {
    if (!player || !!user) return;
    const openLoginAfterVideo = () => openLoginPopup("soundbite/end");
    player.addEventListener("ended", openLoginAfterVideo);
    return () => player.removeEventListener("ended", openLoginAfterVideo);
  }, [player, user]);

  useEffect(() => {
    const biteIds = playlist?.biteIds;
    const bites = playlist?.bites;
    if (!player || !biteIds || !bites) {
      return;
    }

    const currentAvailableIndex = bites.findIndex((b) => b.id === bite.id);

    const playBite = (bite: Soundbite, index: number) => {
      navigation.setParams({
        id: bite.id,
        playlist: playlist.id,
        index: index,
        t: undefined,
      });
    };

    const playNext = () => {
      if (!bites) return;
      const nextAvailableBite =
        bites[(currentAvailableIndex + 1) % bites.length];
      // since bites only contain accessible bites, we need to get the actual index from biteIds
      const nextIndex = nextAvailableBite
        ? biteIds.findIndex((biteId) => biteId === nextAvailableBite.id)
        : 0;

      if (!nextAvailableBite) return;

      playBite(nextAvailableBite, nextIndex);
    };

    player.addEventListener("ended", playNext);
    return () => {
      player?.removeEventListener("ended", playNext);
    };
  }, [bite, playlist, player, navigation, index]);

  const [isPlaylistQueueOpen, openPlaylistQueue, closePlaylistQueue] =
    useBooleanState();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      closePlaylistQueue();
    }
  }, [isFocused, closePlaylistQueue]);

  const [isOpenShare, openShare, closeShare] = useBooleanState();
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState();

  const theme = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: bite.name,
      headerTitle: theme.breakpoint >= Breakpoint.Medium ? bite.name : "",
      headerRight() {
        return (
          <HeaderRight openShare={openShare} openMenu={openMenu} bite={bite} />
        );
      },
    });
  }, [openShare, openMenu, bite, navigation, theme.breakpoint]);

  const isStillLoading = loading && !bite.sources;

  const [videoHidden, setVideoHidden] = useState(false);

  const isMobileBreakpoint = theme.breakpoint === Breakpoint.Small;

  return (
    <>
      <SafeAreaView style={styles.root(theme)} edges={["bottom"]}>
        <View style={styles.main(theme)}>
          <PlayerComponentContainer videoHidden={videoHidden}>
            {isStillLoading ? (
              <LoadingScreen />
            ) : (
              isFocused && (
                <PlayerComponent
                  videoHidden={videoHidden}
                  setVideoHidden={setVideoHidden}
                />
              )
            )}
          </PlayerComponentContainer>
          {!videoHidden && <BiteMetadata bite={bite} />}
          {isMobileBreakpoint ? (
            <BiteScreenMobileTabs bite={bite} isStillLoading={isStillLoading} />
          ) : (
            <BiteSummary bite={bite} />
          )}

          {playlist && (
            <PlaylistQueueBottomBar
              isOpen={isPlaylistQueueOpen}
              onPress={openPlaylistQueue}
              playlist={playlist}
              index={index || 0}
            />
          )}
        </View>
        {!isMobileBreakpoint && <BiteScreenDesktopSide bite={bite} />}
      </SafeAreaView>
      {playlist && (
        <PlaylistQueue
          playlist={playlist}
          isOpen={isPlaylistQueueOpen}
          close={closePlaylistQueue}
          index={index || 0}
        />
      )}
      <BiteShareDialog bite={bite} isOpen={isOpenShare} close={closeShare} />
      <BiteBottomSheetMenu
        bite={bite}
        isOpen={isOpenMenu}
        close={closeMenu}
        onDelete={() => navigation.goBack()}
        showDownload
        fromRef="bite-screen"
      />
    </>
  );
};

export const BiteScreenContentLoading: FC = () => {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.root(theme)}>
      <View style={styles.main(theme)}>
        <PlayerComponentContainer>
          <LoadingScreen />
        </PlayerComponentContainer>
        <LoadingBiteMetadata />
      </View>
    </SafeAreaView>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    flexDirection: "row",
    ...(theme.breakpoint >= Breakpoint.Medium && {
      borderTopColor: theme.colors.borderStaticSubtle,
      borderTopWidth: 1,
    }),
  }),
  main: (theme) => ({
    borderRightWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    flex: 1,
  }),
});
