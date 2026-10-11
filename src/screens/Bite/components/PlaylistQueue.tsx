import { IconPlaylist } from "@/assets/svg";
import { AnimatedTouchableHighlight } from "@/components/Animated";
import { BiteListItem, UnavailbleBiteListItem } from "@/components/Bite";
import { Dialog } from "@/components/Dialog";
import { LinkView } from "@/components/Link";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { createStyles, useTheme, vars } from "@/styles";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import { useNavigation } from "@react-navigation/native";
import type { ListRenderItem } from "@shopify/flash-list";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useEffect, useMemo, useRef, type FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export const PlaylistQueue: FC<{
  playlist: Playlist;
  isOpen: boolean;
  index: number;
  close: () => void;
}> = ({ playlist, isOpen, close, index: currentIndex }) => {
  const navigation = useNavigation();
  const theme = useTheme();

  const ref = useRef<FlashListRef<string>>(null);
  useEffect(() => {
    if (!ref.current || !isOpen) return;
    ref.current.scrollToIndex({ index: currentIndex, animated: true });
  }, [isOpen, currentIndex]);

  const renderItem = useCallback<ListRenderItem<string>>(
    ({ item: biteId, index }) => {
      const bite = playlist.bites?.find((b) => b.id === biteId);
      const onPress = bite
        ? () => {
            close();
            navigation.setParams({
              id: bite.id,
              playlist: playlist.id,
              index,
              t: undefined,
            });
          }
        : undefined;
      const elem = bite ? (
        <BiteListItem bite={bite} style={styles.item} role="listitem" />
      ) : (
        <UnavailbleBiteListItem style={styles.item} />
      );

      const isCurrent = index === currentIndex;

      return (
        <TouchableOpacity
          onPress={onPress}
          style={[isCurrent && styles.selected(theme)]}
          role="option"
          aria-selected={isCurrent}
        >
          {elem}
        </TouchableOpacity>
      );
    },
    [playlist, navigation, currentIndex, close, theme],
  );

  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      <Dialog.Header>
        <LinkView
          href={{
            pathname: RouteNames.Playlist,
            params: {
              id: playlist.id,
            },
          }}
          animated
        >
          <Text color="textMuted" fontSize={12}>
            Playlist
          </Text>
          <Text color="textPrimary" fontWeight="500" fontSize={14}>
            {playlist.name}
          </Text>
        </LinkView>
      </Dialog.Header>
      <FlashList
        style={styles.list}
        ref={ref}
        data={playlist.biteIds || []}
        renderItem={renderItem}
        role="list"
      />
    </Dialog.Root>
  );
};

export const PlaylistQueueBottomBar: FC<{
  playlist: Playlist;
  index: number;
  onPress: () => void;
  isOpen: boolean;
}> = ({ playlist, index, onPress, isOpen }) => {
  const theme = useTheme();
  const nextBite = useMemo(() => {
    const biteIds = playlist?.biteIds;
    const bites = playlist?.bites;
    if (!biteIds || !bites) return null;
    const currentAvailableIndex = bites.findIndex(
      (b) => b.id === biteIds[index],
    );
    return bites[currentAvailableIndex + 1];
  }, [playlist, index]);

  return (
    <SafeAreaView style={styles.barRoot} edges={{ bottom: "maximum" }}>
      {!isOpen && (
        <AnimatedTouchableHighlight
          underlayColor={theme.colors.layerMuted}
          activeOpacity={1}
          onPress={onPress}
          entering={FadeInDown.duration(300)}
          exiting={FadeOutDown.duration(300)}
          style={styles.button(theme)}
        >
          <View style={styles.buttonContainer}>
            <IconPlaylist color={theme.colors.textSecondary} />
            <View style={styles.buttonText}>
              <Text color="textSecondary" numberOfLines={1}>
                {nextBite ? `Next: ${nextBite.name}` : `End of playlist`}
              </Text>
              <Text color="textHint" numberOfLines={1}>
                {playlist.name} • {index + 1}/{playlist.count}
              </Text>
            </View>
          </View>
        </AnimatedTouchableHighlight>
      )}
    </SafeAreaView>
  );
};

const styles = createStyles({
  barRoot: {
    position: "absolute",
    width: "100%",
    padding: 16,
    paddingBottom: 8,
    bottom: 0,
    left: 0,
  },
  button: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    width: "100%",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderColor: theme.colors.borderStaticSubtle,
    borderWidth: 1,
    ...vars.elevations[2],
  }),
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    flex: 1,
  },
  list: {
    maxHeight: 400,
  },
  item: {
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selected: (theme) => ({
    backgroundColor: theme.colors.layerStrong,
  }),
});
