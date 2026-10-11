import { IconGoogleCalendar, IconPlus } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useOpenAddModal } from "@/features/global-modals";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const UpcomingMeetingEmptyState: FC<{
  hideAddButton?: boolean;
}> = ({ hideAddButton }) => {
  const theme = useTheme();

  const openAdd = useOpenAddModal();

  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <IconGoogleCalendar
          width={40}
          height={40}
          color={theme.colors.textSecondary}
        />
        <View style={styles.texts}>
          <Text
            variant="title2Regular"
            style={styles.text}
            color={"textSecondary"}
          >
            No meetings in the next 2 days
          </Text>
          <Text variant="body2Regular" color="textMuted" style={styles.text}>
            Schedule a meeting on your calendar or once you are in a live
            meeting, it’ll be auto-appear here.
          </Text>
        </View>
        {openAdd && !hideAddButton && (
          <Button
            onPress={() => {
              openAdd("home/upcoming-meetings/empty-state");
            }}
            Icon={IconPlus}
          >
            New
          </Button>
        )}
      </View>
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
