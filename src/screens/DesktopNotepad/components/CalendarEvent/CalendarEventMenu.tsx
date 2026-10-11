import { IconCheck } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { CalendarEvents } from "@/graphql";
import { format, isValid } from "date-fns";
import { type FC, useEffect, useRef } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { useRowHover } from "../../hooks/useRowHover";

interface CalendarEventMenuProps {
  events: CalendarEvents[];
  isLoading: boolean;
  selectedTitle: string | null;
  onSelect: (event: CalendarEvents) => void;
  onDeselect: () => void;
}

export const CalendarEventMenu: FC<CalendarEventMenuProps> = ({
  events,
  isLoading,
  selectedTitle,
  onSelect,
  onDeselect,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = (
      scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement }
    )?.getScrollableNode?.();
    node?.classList.add("notepad-thin-scrollbar");
  }, []);

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <Text variant="body3Regular" color="textHint">
          Loading events…
        </Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="body3Regular" color="textHint">
          No event scheduled today
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        variant="label3Weight"
        color="textHint"
        style={styles.sectionHeader}
      >
        CALENDAR EVENT
      </Text>
      {events.map((event) => {
        const isSelected = !!selectedTitle && event.title === selectedTitle;
        return (
          <EventRow
            key={event._id ?? event.iCalUID ?? event.meetingId}
            event={event}
            selected={isSelected}
            onPress={() => (isSelected ? onDeselect() : onSelect(event))}
          />
        );
      })}
    </ScrollView>
  );
};

interface EventRowProps {
  event: CalendarEvents;
  selected: boolean;
  onPress: () => void;
}

const EventRow: FC<EventRowProps> = ({ event, selected, onPress }) => {
  const theme = useTheme();
  const { ref, isHovered } = useRowHover();

  const timeLabel = formatEventTime(event);

  return (
    <Pressable onPress={onPress}>
      <View
        ref={ref}
        style={[styles.row, isHovered && styles.rowHovered(theme)]}
      >
        <View style={styles.indicator(theme)} />
        <View style={styles.eventContent}>
          <Text variant="body2Regular" color="textSecondary" numberOfLines={1}>
            {event.title}
          </Text>
          {timeLabel && (
            <Text variant="body3Regular" color="textHint">
              {timeLabel}
            </Text>
          )}
        </View>
        {selected && (
          <IconCheck width={16} height={16} color={theme.colors.textPrimary} />
        )}
      </View>
    </Pressable>
  );
};

function formatEventTime(event: CalendarEvents): string | null {
  const start = event.date ? new Date(event.date) : null;
  const end = event.endDate ? new Date(event.endDate) : null;

  if (!start || !isValid(start)) return null;

  const startStr = format(start, "h:mm");
  const endStr = end && isValid(end) ? format(end, "h:mm a") : null;

  return endStr ? `${startStr} - ${endStr}` : format(start, "h:mm a");
}

const styles = createStyles({
  list: {
    maxHeight: 280,
  },
  listContent: {
    paddingVertical: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  rowHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
  indicator: (theme) => ({
    width: 3,
    height: 32,
    borderRadius: 2,
    backgroundColor: theme.colors.commandPrimaryDefault,
  }),
  eventContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
});
