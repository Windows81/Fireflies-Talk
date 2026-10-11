import { IconGoogleCalendar, IconOutlook } from "@/assets/svg";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { FC } from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";

const meetingButtons = [
  {
    provider: "Google Calendar",
    icon: <IconGoogleCalendar />,
    url: "https://calendar.google.com/calendar/u/0/r/eventedit?add=fred@fireflies.ai",
  },
  {
    provider: "Outlook Calendar",
    icon: <IconOutlook />,
    url: "https://outlook.live.com/calendar/0/deeplink/compose?to=fred@fireflies.ai",
  },
];

export const ScheduleMeetingModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  const theme = useTheme();
  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="bottomSheet">
      <Dialog.Header>Schedule meeting</Dialog.Header>
      <View style={styles.root}>
        {meetingButtons.map((meetingButton) => (
          <TouchableOpacity
            key={meetingButton.provider}
            style={[
              styles.button,
              { backgroundColor: theme.colors.layerMuted },
            ]}
            onPress={() => {
              Linking.openURL(meetingButton.url);
              tracker.track(TRACKING_EVENTS.SCHEDULE_MEETING_LINK_CLICKED, {
                provider: meetingButton.provider,
              });
              close();
            }}
            role="button"
          >
            {meetingButton.icon}
            <Text color="textSecondary">{meetingButton.provider}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 8,
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    width: "100%",
  },
});
