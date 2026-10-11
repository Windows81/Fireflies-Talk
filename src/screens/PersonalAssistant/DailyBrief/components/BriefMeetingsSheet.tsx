import { Avatar } from "@/components/Avatar";
import { BottomSheet } from "@/components/BottomSheet";
import { Text } from "@/components/Typography";
import type { AiAppsMeeting } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { pluralize } from "@/utils/pluralize";
import { format } from "date-fns";
import { useCallback, type FC } from "react";
import type { ListRenderItem } from "react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BriefMeetingsSheetProps {
  isOpen: boolean;
  close: () => void;
  meetings: AiAppsMeeting[];
  onMeetingPress: (meetingId: string) => void;
}

const keyExtractor = (meeting: AiAppsMeeting) => meeting.id;

export const BriefMeetingsSheet: FC<BriefMeetingsSheetProps> = ({
  isOpen,
  close,
  meetings,
  onMeetingPress,
}) => {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const count = meetings.length;

  const renderItem = useCallback<ListRenderItem<AiAppsMeeting>>(
    ({ item }) => {
      const date = new Date(item.startTime);
      const dateLabel = format(date, "d MMM, hh:mm a");

      return (
        <Pressable
          onPress={() => onMeetingPress(item.id)}
          style={styles.meetingRow(theme)}
        >
          <Avatar
            name={item.ownerName}
            picture={item.ownerPicture}
            size={40}
            shape="square"
          />
          <View style={styles.meetingText}>
            <Text variant="body1Weight" color="textSecondary" numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="body2Regular" color="textMuted">
              {dateLabel}
            </Text>
          </View>
        </Pressable>
      );
    },
    [onMeetingPress, theme],
  );

  const ListHeader = (
    <View style={styles.header}>
      <Text variant="title2Weight" color="textSecondary">
        Daily Brief from {count} {pluralize("Meeting", count)}
      </Text>
    </View>
  );

  return (
    <BottomSheet.Root isOpen={isOpen} close={close}>
      <BottomSheet.FlatList
        data={meetings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(bottom, 32) },
        ]}
        ItemSeparatorComponent={ItemSeparator}
      />
    </BottomSheet.Root>
  );
};

const ItemSeparator = () => <View style={styles.separator} />;

const styles = createStyles({
  container: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    paddingVertical: 16,
  },
  separator: {
    height: 8,
  },
  meetingRow: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 12,
  }),
  meetingText: {
    flex: 1,
    gap: 2,
  },
});
