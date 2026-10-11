import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { useGetChannelsListQuery } from "@/graphql";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { isDefined } from "@/utils/object";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, type FC } from "react";
import { ScrollView, View } from "react-native";
import type { ParamList } from "../types";
import { ChannelMeetingList } from "./components/ChannelMeetingList";
import {
  ChannelSelector,
  ChannelSelectorSelect,
} from "./components/ChannelSelector";

export const NotebookScreen: FC<
  NativeStackScreenProps<ParamList, "Notebook">
> = ({ route, navigation }) => {
  const channelId = route.params?.channel || "mine";
  const setChannelId = useCallback(
    (newChannelId: string) => {
      navigation.setParams({
        channel: newChannelId,
      });
    },
    [navigation],
  );

  const { user } = useAuth();

  const { data: dataGetChannelsList } = useGetChannelsListQuery({
    onError(err) {
      toast({
        title: "Could not load channels",
        message: err.message,
        type: "error",
      });
    },
    skip: !user,
  });

  const theme = useTheme();

  const isLargeScreen = theme.breakpoint != Breakpoint.Small;

  const channelList =
    dataGetChannelsList?.getChannelsList?.filter(isDefined) ?? [];

  return (
    <>
      <View style={styles.root(theme)}>
        {isLargeScreen && (
          <View style={styles.side(theme)}>
            <ScrollView>
              <ChannelSelector
                channelId={channelId}
                setChannelId={setChannelId}
                list={channelList}
              />
            </ScrollView>
          </View>
        )}
        <View style={styles.content}>
          {!isLargeScreen && (
            <ChannelSelectorSelect
              channelId={channelId}
              setChannelId={setChannelId}
              channelList={channelList}
            />
          )}
          <ChannelMeetingList channelId={channelId} />
        </View>
      </View>
    </>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    flexDirection: "row",
    borderTopColor: theme.colors.borderStaticDefault,
    borderTopWidth: 1,
  }),
  side: (theme) => ({
    width: 248,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderStaticDefault,
    backgroundColor: theme.colors.layerSubtle,
  }),
  content: {
    flexDirection: "column-reverse", // screen-reader to see select first
    flex: 1,
  },
});
