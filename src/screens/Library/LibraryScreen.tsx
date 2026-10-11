import { IconPlus } from "@/assets/svg";
import { FabButton, FabButtonContainer } from "@/components/FabButton";
import type { TabsRef } from "@/components/Tabs";
import { Tabs } from "@/components/Tabs";
import { RouteNames } from "@/constants";
import { openCreatePlaylistModal } from "@/features/global-modals";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { RootNavigation } from "../RootNavigation";
import type { ParamList } from "../types";
import { BitesTab } from "./components/BitesTab";
import { PlaylistsTab } from "./components/PlaylistsTab";

export const LibraryScreen: FC<
  NativeStackScreenProps<ParamList, "Library">
> = ({ route, navigation }) => {
  const onTabChange = useCallback(
    (tab: string) => {
      navigation.setParams({
        tab,
      });
    },
    [navigation],
  );

  const ref = useRef<TabsRef>(null);
  useEffect(() => {
    ref.current?.setTab(route.params?.tab === "playlists" ? 1 : 0);
  }, [route.params?.tab]);

  return (
    <>
      <View style={styles.root}>
        <Tabs.Root
          ref={ref}
          initialTab={route.params?.tab}
          onTabChange={onTabChange}
        >
          <Tabs.Panel name="soundbites" title="Soundbites">
            <BitesTab />
          </Tabs.Panel>
          <Tabs.Panel name="playlists" title="Playlists">
            <PlaylistsTab />
          </Tabs.Panel>
        </Tabs.Root>
      </View>
      <FabButtonContainer>
        {route.params?.tab === "playlists" && (
          <FabButton
            Icon={IconPlus}
            onPress={() => {
              openCreatePlaylistModal({
                onCreated: (newPlaylist) =>
                  RootNavigation.navigate(RouteNames.Playlist, {
                    id: newPlaylist.id,
                  }),
                fromRef: "library/fab",
              });
            }}
            aria-label="Create playlist"
          />
        )}
      </FabButtonContainer>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
});
