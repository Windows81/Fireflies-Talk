import { IconCheck, IconClose } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import {
  filterCalendarEvents,
  findCurrentEvent,
  useUpcomingCalendarEvents,
  type MeetingCalendarEventLink,
} from "@/features/calendar";
import { createStyles, useTheme, type Theme } from "@/styles";
import { type FC, useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useLiveScreenContext } from "../../Context/LiveScreenContext";

// Events begin and end between calendar polls, so the current event is
// re-evaluated on its own cadence.
const CURRENT_EVENT_REFRESH_MS = 30_000;

interface CalendarSuggestionBannerProps {
  meetingTitle: string;
  calendarLink: MeetingCalendarEventLink;
  onAccept: () => void;
  onDismiss: () => void;
  titleFallback: React.ReactNode;
}

export const CalendarSuggestionBanner: FC<CalendarSuggestionBannerProps> = ({
  meetingTitle,
  calendarLink,
  onAccept,
  onDismiss,
  titleFallback,
}) => {
  const theme = useTheme();
  const { isMeetingEnded, isSelfRecordingSession } = useLiveScreenContext();
  const { events: allEvents } = useUpcomingCalendarEvents();
  const { connectedEventTitle, connectEvent } = calendarLink;

  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Date.now()),
      CURRENT_EVENT_REFRESH_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const currentEvent = findCurrentEvent(filterCalendarEvents(allEvents), now);

  const handleAccept = useCallback(() => {
    if (!currentEvent?.title) return;

    connectEvent(currentEvent);
    onAccept();
  }, [currentEvent, connectEvent, onAccept]);

  if (
    !currentEvent ||
    connectedEventTitle ||
    currentEvent.title === meetingTitle ||
    isMeetingEnded ||
    isSelfRecordingSession !== true
  ) {
    return <>{titleFallback}</>;
  }

  return (
    <View style={styles.container}>
      <Text
        variant="heading4Weight"
        color="commandHintDefault"
        numberOfLines={1}
        style={styles.label}
      >
        Is this{" "}
        <Text variant="heading4Weight" color="textSecondary">
          {currentEvent.title}
        </Text>
        ?
      </Text>
      <View style={styles.actions}>
        <ActionButton
          icon={
            <IconCheck
              width={16}
              height={16}
              color={theme.colors.informationInteractiveGreenDefault}
            />
          }
          onPress={handleAccept}
          theme={theme}
        />
        <ActionButton
          icon={
            <IconClose
              width={16}
              height={16}
              color={theme.colors.commandHintDefault}
            />
          }
          onPress={onDismiss}
          theme={theme}
        />
      </View>
    </View>
  );
};

const ActionButton: FC<{
  icon: React.ReactNode;
  onPress: () => void;
  theme: Theme;
}> = ({ icon, onPress, theme }) => {
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        isHovered && styles.actionButtonHover(theme),
      ]}
      {...webHoverProps}
    >
      {icon}
    </Pressable>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
});
