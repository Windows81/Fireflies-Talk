import { useUpcomingCalendarEvents } from "@/features/calendar";
import { useLiveMeetings } from "@/features/live";
import { createStyles } from "@/styles";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import { View } from "react-native";
import type { ParamList } from "../types";
import { SideView } from "../Home/Side/Side";

export const CalendarScreen: FC<
  NativeStackScreenProps<ParamList, "Calendar">
> = () => {
  const calendarEventProps = useUpcomingCalendarEvents();
  const { liveMeetings } = useLiveMeetings({ calendarEventProps });

  return (
    <View style={styles.root}>
      <SideView {...calendarEventProps} liveMeetings={liveMeetings} />
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
});
