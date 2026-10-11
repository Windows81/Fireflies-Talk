import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { useLocalSettings } from "@/features/settings";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useCallback, type FC } from "react";
import { View } from "react-native";

export const SystemAudioSettings: FC = () => {
  const {
    autoDetectMeetings,
    setAutoDetectMeetings,
    autoStartNotes,
    setAutoStartNotes,
  } = useLocalSettings();

  const handleAutoStartNotesToggle = useCallback(
    (enabled: boolean) => {
      tracker.track(TRACKING_EVENTS.DESKTOP_AUTO_START_NOTES_TOGGLED, {
        enabled,
        source: "onboarding",
      });
      setAutoStartNotes(enabled);
    },
    [setAutoStartNotes],
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text variant="body2Regular" color="textPrimary">
            Notify when a meeting is detected
          </Text>
          <Text variant="body3Regular" style={styles.description}>
            Get notified so you can start capturing an ad-hoc or unscheduled
            call.
          </Text>
        </View>
        <Switch
          value={autoDetectMeetings}
          onValueChange={setAutoDetectMeetings}
          aria-label="Notify when a meeting is detected"
        />
      </View>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text variant="body2Regular" color="textPrimary">
            Automatically take notes
          </Text>
          <Text variant="body3Regular" style={styles.description}>
            Skip the notification and start taking notes as soon as a call is
            detected.
          </Text>
        </View>
        <Switch
          value={autoStartNotes}
          onValueChange={handleAutoStartNotesToggle}
          aria-label="Automatically take notes"
        />
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    flex: 1,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 500,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey900,
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  description: {
    color: DESKTOP_THEME.grey500,
  },
});
