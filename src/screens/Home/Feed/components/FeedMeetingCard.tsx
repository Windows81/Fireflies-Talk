import { FeedGistBullet, loadingFeedGistBulletNodes } from "@/components/Feed";
import type { CoreFeedMeetingFieldsFragment } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import {
  LoadingMeetingHeader,
  MeetingHeader,
} from "../../components/MeetingHeader";
import { meetingCardStyles } from "../../components/styles";

export const FeedMeetingCard: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
}> = ({ meeting }) => {
  const theme = useTheme();

  return (
    <View style={meetingCardStyles.root}>
      <MeetingHeader meeting={meeting} />
      <View style={meetingCardStyles.content(theme)}>
        {meeting.summary.map((summary, index) => (
          <FeedGistBullet key={index} {...summary} />
        ))}
      </View>
    </View>
  );
};

export const LoadingFeedMeetingCard: FC = () => {
  const theme = useTheme();

  return (
    <View style={meetingCardStyles.root}>
      <LoadingMeetingHeader />
      <View style={[meetingCardStyles.content(theme), styles.contentLoading]}>
        {loadingFeedGistBulletNodes}
      </View>
    </View>
  );
};

const styles = createStyles({
  contentLoading: {
    gap: 4,
  },
});
