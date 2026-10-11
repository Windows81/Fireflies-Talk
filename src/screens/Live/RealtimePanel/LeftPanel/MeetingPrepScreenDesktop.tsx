import { type Meeting } from "@/graphql";
import { MeetingPrepBody } from "@/screens/MainDesktop/components/MeetingPrepBody";
import { createStyles } from "@/styles";
import { type FC } from "react";
import { ScrollView, View } from "react-native";

interface MeetingPrepScreenDesktopProps {
  meeting: Meeting;
}

/**
 * Meeting prep view for the desktop realtime panel. Renders the shared
 * MeetingPrepBody for the live meeting; the title and pills come from the
 * MeetingHeader that LeftPanel already renders above.
 */
export const MeetingPrepScreenDesktop: FC<MeetingPrepScreenDesktopProps> = ({
  meeting,
}) => {
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {/* Realtime panel shows only the key-takeaways summary
            (no tasks / company insights / past syncs). */}
        <MeetingPrepBody meetingId={meeting.id} showDetails={false} />
      </ScrollView>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 64,
  },
});
