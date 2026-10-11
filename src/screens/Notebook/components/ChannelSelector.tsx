import { BottomSheet } from "@/components/BottomSheet";
import { Text } from "@/components/Typography";
import { LOCAL_CHANNELS, LOCAL_CHANNEL_NAMES } from "@/features/channel";
import type { Channel } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";

const ChannelListItem: FC<{
  channel: Channel;
  onSelect: (channel: Channel) => void;
  currentChannelId: string;
}> = ({ channel, onSelect, currentChannelId }) => {
  const theme = useTheme();

  const isSelected = channel._id === currentChannelId;

  return (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.itemSelected(theme)]}
      onPress={() => onSelect(channel)}
      role="option"
      aria-selected={isSelected}
    >
      <Text
        color={isSelected ? "commandContrastDefault" : "textSecondary"}
        variant="body2Weight"
        numberOfLines={1}
      >
        {channel.title}
      </Text>
    </TouchableOpacity>
  );
};

const snapPoints = ["50%", "85%"] as `${number}%`[];

export const ChannelSelector: FC<{
  channelId: string;
  setChannelId: (channelId: string) => void;
  list: Channel[];
}> = ({ channelId, setChannelId, list }) => {
  const onChannelSelect = useCallback(
    (channel: Channel) => {
      tracker.track(TRACKING_EVENTS.NOTEBOOK_CHANNEL_SELECTED, {
        channelId: channel._id,
        from: "notebook/channelselector",
      });
      setChannelId(channel._id as string);
    },
    [setChannelId],
  );

  return (
    // @ts-expect-error: find a role for listbox
    <View style={styles.channels} role="listbox" aria-label="Channel List">
      {LOCAL_CHANNELS.map((channel) => (
        <ChannelListItem
          key={`local-channel-${channel._id}`}
          channel={channel}
          onSelect={onChannelSelect}
          currentChannelId={channelId}
        />
      ))}
      <Text style={styles.heading} variant="title3Weight" color="textHint">
        CHANNELS
      </Text>
      {list.map(
        (channel) =>
          channel && (
            <ChannelListItem
              key={`channel-${channel._id}`}
              channel={channel}
              onSelect={onChannelSelect}
              currentChannelId={channelId}
            />
          ),
      )}
    </View>
  );
};

const ChannelSelectorModal: FC<{
  isOpen: boolean;
  close: () => void;
  channelId: string;
  setChannelId: (channelId: string) => void;
  list: Channel[];
}> = ({ isOpen, close, channelId, setChannelId, list }) => {
  return (
    <BottomSheet.Root isOpen={isOpen} close={close} snapPoints={snapPoints}>
      <BottomSheet.Header>Select channel</BottomSheet.Header>
      <BottomSheet.ScrollView style={styles.list} role="listbox">
        <ChannelSelector
          channelId={channelId}
          setChannelId={(channelId) => {
            setChannelId(channelId);
            close();
          }}
          list={list}
        />
      </BottomSheet.ScrollView>
    </BottomSheet.Root>
  );
};

export const ChannelSelectorSelect: FC<{
  channelId: string;
  setChannelId: (channelId: string) => void;
  channelList: Channel[];
}> = ({ channelId, setChannelId, channelList }) => {
  const [isOpenChannelSelect, openChannelSelect, closeChannelSelect] =
    useBooleanState();

  const channelName =
    channelId in LOCAL_CHANNEL_NAMES
      ? LOCAL_CHANNEL_NAMES[channelId as keyof typeof LOCAL_CHANNEL_NAMES]
      : channelList.find((channel) => channel?._id === channelId)?.title;

  const theme = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={openChannelSelect}
        style={styles.selectWrapper(theme)}
        role="button"
      >
        <View>
          <Text variant="label3Regular" color="textHint">
            Channel
          </Text>
          <Text variant="body2Weight" color="textSecondary">
            {channelName}
          </Text>
        </View>
        <Text variant="body2Weight" color="textBrand">
          Change
        </Text>
      </TouchableOpacity>
      <ChannelSelectorModal
        isOpen={isOpenChannelSelect}
        close={closeChannelSelect}
        channelId={channelId}
        setChannelId={setChannelId}
        list={channelList}
      />
    </>
  );
};

const styles = createStyles({
  list: {
    flex: 1,
  },
  channels: {
    flexDirection: "column",
    gap: 8,
  },
  heading: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  item: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemSelected: (theme) => ({
    backgroundColor: theme.colors.commandPrimaryDefault,
  }),
  selectWrapper: (theme) => ({
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStaticDefault,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.layerSubtle,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }),
});
