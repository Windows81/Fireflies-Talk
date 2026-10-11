import { Button } from "@/components/Button";
import { SkeletonLoading } from "@/components/Loading";
import { MessageView } from "@/components/Message";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import type { CalendarEventsProps } from "@/features/calendar";
import type { JoinAllUpcomingMeetingsMutation } from "@/graphql";
import { JoinAllUpcomingMeetingsDocument } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useApolloClient } from "@apollo/client";
import { useCallback, useMemo, useState, type FC } from "react";
import { View } from "react-native";
import { UpcomingMeetingEmptyState } from "./components/UpcomingMeetingEmptyState";
import {
  LoadingUpcomingMeetingItem,
  UpcomingMeetingItem,
} from "./components/UpcomingMeetingItem";
import { groupByDay } from "./utils";
import { IconCheck } from "@/assets/svg";

const LoadingEventsNode = () => (
  <View>
    {Array.from({ length: 2 }).map((_, index) => (
      <View style={styles.group} key={index}>
        <View style={styles.groupHead}>
          <SkeletonLoading width={128} height={14} variant="rect" />
        </View>
        <LoadingUpcomingMeetingItem />
      </View>
    ))}
  </View>
);

export const UpcomingMeetings: FC<CalendarEventsProps> = ({
  events,
  error,
  isLoadingEvents,
  refetch,
}) => {
  const eventsByDay = useMemo(() => {
    return Object.entries(groupByDay(events || []));
  }, [events]);

  const theme = useTheme();

  const hasUnaddedEvents = eventsByDay.some(([, events]) =>
    events.some((event) => !event.fredAdded),
  );

  const apolloClient = useApolloClient();
  const [isJoiningAll, setIsJoiningAll] = useState(false);

  const toggleJoinAll = useCallback(async () => {
    if (!events) return;
    setIsJoiningAll(true);
    try {
      await apolloClient.mutate<JoinAllUpcomingMeetingsMutation>({
        mutation: JoinAllUpcomingMeetingsDocument,
        variables: { addedBy: "mobileJoinAll" },
      });
      await refetch();
    } catch (err) {
      toast({
        title: "Failed to join all upcoming meetings",
        message: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsJoiningAll(false);
    }
  }, [apolloClient, events, refetch]);

  if (!eventsByDay.length && !isLoadingEvents) {
    return (
      <View style={styles.root}>
        <UpcomingMeetingEmptyState />
      </View>
    );
  }

  if (!events && error) {
    return (
      <View style={styles.root}>
        <MessageView
          variant="error"
          title="Could not load upcoming meetings"
          description={error.message}
          action={<Button onPress={() => refetch()}>Retry</Button>}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {eventsByDay.map(([day, events], index) => {
        return (
          <View key={day} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={styles.groupHeadLeading}>
                <Text variant="body2Regular" color="textHint">
                  {day}
                </Text>
                <View style={styles.groupBadge(theme)}>
                  <Text
                    variant="body3Regular"
                    color="informationStaticGreenText"
                  >
                    {events.length}
                  </Text>
                </View>
              </View>
              {index === 0 && (
                <View style={styles.joinAllContainer}>
                  {isJoiningAll ||
                    (!hasUnaddedEvents && (
                      <IconCheck stroke={theme.colors.textBrand} width={16} />
                    ))}
                  <Button
                    variant="transparentPrimary"
                    size="xs"
                    disabled={isJoiningAll || !hasUnaddedEvents}
                    onPress={toggleJoinAll}
                  >
                    Join All
                  </Button>
                </View>
              )}
            </View>
            {events.map((event) => (
              <UpcomingMeetingItem
                key={event._id}
                event={event}
                isJoiningAll={isJoiningAll}
              />
            ))}
          </View>
        );
      })}
      {isLoadingEvents && <LoadingEventsNode />}
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    gap: 20,
  },
  group: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
  },
  groupHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
  },
  groupHeadLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groupBadge: (theme) => ({
    backgroundColor: theme.colors.informationStaticGreenSubtle,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 4,
  }),
  joinAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
