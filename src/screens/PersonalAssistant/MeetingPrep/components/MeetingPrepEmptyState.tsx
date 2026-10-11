import { IconMeetingPrepEmpty, IconPlus } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { ScheduleMeetingModal } from "@/features/global-modals/add-modal/components";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const MeetingPrepEmptyState: FC = () => {
  const [isOpenSchedule, openSchedule, closeSchedule] = useBooleanState();

  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <IconMeetingPrepEmpty width={124} height={152} />
        <View style={styles.texts}>
          <Text
            variant="title2Regular"
            style={styles.text}
            color="textSecondary"
          >
            No meetings to prep
          </Text>
          <Text variant="body2Regular" color="textMuted" style={styles.text}>
            Add recurring meetings to receive timely prep, context, and insights
            before each session.
          </Text>
        </View>
        <Button onPress={openSchedule} Icon={IconPlus}>
          Schedule
        </Button>
      </View>
      <ScheduleMeetingModal isOpen={isOpenSchedule} close={closeSchedule} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    flex: 1,
    alignSelf: "stretch",
  },
  leading: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    alignSelf: "stretch",
  },
  texts: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  text: {
    textAlign: "center",
  },
});
