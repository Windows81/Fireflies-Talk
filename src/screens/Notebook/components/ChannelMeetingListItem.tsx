import { LinkView } from "@/components/Link";
import { SkeletonLoading } from "@/components/Loading";
import { LoadingMeetingListItem, MeetingListItem } from "@/components/Meeting";
import { Separator } from "@/components/Separator";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import type { Source } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import type { WeekGrouped } from "@/utils/date";
import { getWeekGroupLabel } from "@/utils/date";
import { pluralize } from "@/utils/pluralize";
import type { FC } from "react";
import { Fragment } from "react";
import { View } from "react-native";

const styles = createStyles({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeaderBg: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
  }),
  container: {
    paddingHorizontal: 16,
  },
});

export const ChannelMeetingListSectionHeader: FC<{
  group: WeekGrouped<Source>;
}> = ({ group }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.sectionHeader,
        styles.sectionHeaderBg(theme),
        styles.container,
      ]}
    >
      <Text variant="body2Weight" color="textSecondary">
        {getWeekGroupLabel(group)}
      </Text>
      <Text variant="body2Regular" color="textMuted">
        ·
      </Text>
      <Text variant="body2Regular" color="textMuted">
        {group.items.length} {pluralize("Meeting", group.items.length)}
      </Text>
    </View>
  );
};

export const ChannelMeetingListSectionItem: FC<{
  item: Source;
  setSourceForMenu: (source: Source) => void;
}> = ({ item, setSourceForMenu }) => (
  <Fragment>
    <LinkView
      href={{
        pathname: RouteNames.Notepad,
        params: {
          id: item.parseId as string,
        },
      }}
      onLongPress={() => setSourceForMenu(item)}
      animated="highlight"
      style={styles.container}
    >
      <MeetingListItem meeting={item} />
    </LinkView>
    <Separator />
  </Fragment>
);

export const LoadingMeetingNode = () => (
  <>
    {Array.from({ length: 2 }).map((_, index) => (
      <View key={index} style={styles.container}>
        <View style={styles.sectionHeader}>
          <SkeletonLoading width={100} height={16} />
          <SkeletonLoading width={40} height={16} />
        </View>
        <View>
          <LoadingMeetingListItem />
          <LoadingMeetingListItem />
          <LoadingMeetingListItem />
        </View>
      </View>
    ))}
  </>
);
