import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useUpcomingCalendarEvents } from "@/features/calendar";
import { FeedbackStarRating } from "@/features/feedback-nudge";
import { type CalendarEvents } from "@/graphql";
import { useListMeetingPreps } from "@/hooks/useListMeetingPreps";
import { useTheme } from "@/styles";
import { isDesktop } from "@/utils/device";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useGetMeetingPrepOutputWithTasksQuery } from "@firefliesai/ai-apps-service.graphql-client";
import { format, isToday, isTomorrow } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { UpcomingMeetingItem } from "@/screens/Home/UpcomingMeetings/components/UpcomingMeetingItem";
import { groupByDay } from "@/screens/Home/UpcomingMeetings/utils";
import { useAiAppViewedTracking } from "@/screens/PersonalAssistant/helpers/useAiAppViewedTracking";
import type { ParamList } from "../../types";
import { MeetingPrepBodySkeleton } from "./components/MeetingPrepBodySkeleton";
import { MeetingPrepEmptyState } from "./components/MeetingPrepEmptyState";
import { MeetingPrepNoPrepState } from "./components/MeetingPrepNoPrepState";
import { MeetingPrepSkeleton } from "./components/MeetingPrepSkeleton";
import { type MeetingPrepTask } from "./components/MeetingPrepTasks";
import { PrepContent } from "./components/PrepContent";
import { styles } from "./MeetingPrepScreen.styles";

interface DayGroup {
  label: string;
  events: CalendarEvents[];
  date: Date;
}

// Scroll level to show the separator between the day selector and the meeting prep items.
const SHOW_SEPARATOR_BORDER_SCROLL_LEVEL = 157;

/**
 * Build labels for day buttons. Uses "Today" / "Tomorrow" for relative days,
 * otherwise abbreviated month plus day number (e.g. "Apr 18").
 */
function buildDayLabels(dates: Date[]): string[] {
  return dates.map((d) => {
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  });
}

export const MeetingPrepScreen: FC<
  NativeStackScreenProps<ParamList, "MeetingPrep">
> = ({ route }) => {
  const targetMeetingId = route.params?.meetingId;
  const theme = useTheme();
  const navigation = useNavigation();

  useAiAppViewedTracking({
    appTitle: "Meeting Prep",
    appId: route.params?.appId,
  });

  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.85;

  const {
    events,
    isLoadingEvents,
    refetch: refetchEvents,
    error: eventsError,
  } = useUpcomingCalendarEvents();
  const { meetingPrepEventIds, loading: isLoadingPrepIds } =
    useListMeetingPreps();

  // Only show events that have a meeting prep output available
  const filteredEvents = useMemo<CalendarEvents[]>(() => {
    if (!events?.length || !meetingPrepEventIds) return [];
    return events.filter(
      (e) =>
        (e._id && meetingPrepEventIds.has(e._id)) ||
        (e.meetingId && meetingPrepEventIds.has(e.meetingId)),
    );
  }, [events, meetingPrepEventIds]);

  // Group filtered events by day
  const dayGroups = useMemo<DayGroup[]>(() => {
    if (!filteredEvents.length) return [];
    const grouped = groupByDay(filteredEvents);
    return Object.entries(grouped).map(([label, dayEvents]) => ({
      label,
      events: dayEvents,
      date: new Date(dayEvents[0].date!),
    }));
  }, [filteredEvents]);

  const dayLabels = useMemo(
    () => buildDayLabels(dayGroups.map((g) => g.date)),
    [dayGroups],
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState(0);
  const hasAutoScrolled = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const meetingListRef = useRef<FlatList<CalendarEvents>>(null);
  const buttonScrollRef = useRef<ScrollView>(null);
  const scrollViewOffset = useRef(0);
  const isScrollingFromCard = useRef(false);
  const buttonLayouts = useRef<Record<number, { x: number; width: number }>>(
    {},
  );

  const currentDayEvents = dayGroups[selectedDayIndex]?.events ?? [];
  const currentMeeting = currentDayEvents[selectedMeetingIndex];
  const currentMeetingId =
    currentMeeting?.meetingId ?? currentMeeting?._id ?? "";

  const {
    data: prepData,
    error: prepError,
    loading: isLoadingPrep,
    refetch: refetchPrep,
  } = useGetMeetingPrepOutputWithTasksQuery({
    variables: { input: { meetingId: currentMeetingId } },
    skip: !currentMeetingId,
  });

  const currentPrepOutput = prepData?.getMeetingPrepOutput ?? null;

  const scrollButtonIntoView = useCallback(
    (index: number) => {
      const layout = buttonLayouts.current[index];
      if (!layout || !buttonScrollRef.current) return;

      const visibleLeft = scrollViewOffset.current;
      const visibleRight = visibleLeft + screenWidth;
      const isLastItem = index === dayGroups.length - 1;

      if (isLastItem) {
        buttonScrollRef.current.scrollToEnd();
        return;
      }

      if (layout.x >= visibleLeft && layout.x + layout.width <= visibleRight) {
        return;
      }

      const scrollX = Math.max(0, layout.x - 20);
      scrollViewOffset.current = scrollX;
      buttonScrollRef.current.scrollTo({ x: scrollX, animated: true });
    },
    [dayGroups.length, screenWidth],
  );

  const onDayPress = useCallback(
    (index: number) => {
      setSelectedDayIndex(index);
      setSelectedMeetingIndex(0);
      meetingListRef.current?.scrollToOffset({ offset: 0, animated: false });
      scrollButtonIntoView(index);
    },
    [scrollButtonIntoView],
  );

  const onButtonScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollViewOffset.current = e.nativeEvent.contentOffset.x;
    },
    [],
  );

  const onMeetingViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (isScrollingFromCard.current) return;
      const first = viewableItems[0];
      if (first?.index != null) {
        setSelectedMeetingIndex(first.index);
      }
    },
  ).current;

  const meetingViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleMeetingCardPress = useCallback((index: number) => {
    isScrollingFromCard.current = true;
    setSelectedMeetingIndex(index);
    meetingListRef.current?.scrollToIndex({ index, animated: true });
    setTimeout(() => {
      isScrollingFromCard.current = false;
    }, 500);
  }, []);

  // Auto-scroll to target meeting from deep link
  useEffect(() => {
    if (!targetMeetingId || hasAutoScrolled.current || !dayGroups.length)
      return;

    for (let dayIdx = 0; dayIdx < dayGroups.length; dayIdx++) {
      const meetingIdx = dayGroups[dayIdx].events.findIndex(
        (e) => e.meetingId === targetMeetingId || e._id === targetMeetingId,
      );
      if (meetingIdx === -1) continue;

      hasAutoScrolled.current = true;
      if (dayIdx !== selectedDayIndex) {
        setSelectedDayIndex(dayIdx);
        scrollButtonIntoView(dayIdx);
      }
      if (meetingIdx !== selectedMeetingIndex) {
        handleMeetingCardPress(meetingIdx);
      }
      return;
    }
  }, [
    targetMeetingId,
    dayGroups,
    selectedDayIndex,
    selectedMeetingIndex,
    scrollButtonIntoView,
    handleMeetingCardPress,
  ]);

  const pastNotes = currentPrepOutput?.pastNotes;

  const handleSourceMeetingPress = useCallback(() => {
    if (!pastNotes?.meetingId) return;
    navigation.navigate(RouteNames.Notepad, {
      id: pastNotes.meetingId,
      ref: "meeting-prep",
    });
  }, [pastNotes, navigation]);

  // Loading: show skeleton only on initial load (no cached data yet)
  if (
    (isLoadingEvents && !events) ||
    (isLoadingPrepIds && !meetingPrepEventIds)
  )
    return <MeetingPrepSkeleton />;

  if ((eventsError || prepError) && !events && !currentPrepOutput) {
    return (
      <MessageView
        variant="error"
        title="Could not load Meeting Prep"
        action={
          <Button
            onPress={() => {
              refetchEvents();
              refetchPrep();
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  if (!dayGroups.length) return <MeetingPrepEmptyState />;

  const prepTasks = (pastNotes?.tasks ?? []) as MeetingPrepTask[];
  const hasPrepContent = pastNotes?.bulletGist?.length || pastNotes?.overview;

  const renderMeetingCard = ({
    item,
    index,
  }: {
    item: CalendarEvents;
    index: number;
  }) => (
    <Pressable
      onPress={() => handleMeetingCardPress(index)}
      style={{ width: cardWidth }}
    >
      <UpcomingMeetingItem
        event={item}
        selected={index === selectedMeetingIndex}
      />
    </Pressable>
  );

  return (
    <Animated.ScrollView
      style={styles.root}
      contentContainerStyle={styles.rootContent}
      stickyHeaderIndices={[0]}
      onScroll={(e) => {
        const shouldShowBorder =
          e.nativeEvent.contentOffset.y >= SHOW_SEPARATOR_BORDER_SCROLL_LEVEL;
        if (shouldShowBorder !== isScrolled) setIsScrolled(shouldShowBorder);
      }}
    >
      {/* Day selector — sticky in both orientations */}
      <View
        style={[
          styles.stickyHeader(theme),
          isScrolled && styles.stickyHeaderBorder(theme),
        ]}
      >
        <View style={styles.headerContainer(theme)}>
          <ScrollView
            ref={buttonScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buttonsRow}
            onScroll={onButtonScroll}
            scrollEventThrottle={16}
          >
            {dayGroups.map((group, i) => {
              const isSelected = i === selectedDayIndex;
              return (
                <Button
                  key={group.label}
                  variant="outlined"
                  size="sm"
                  style={
                    isSelected
                      ? styles.selectedButton(theme)
                      : styles.unselectedButton
                  }
                  onPress={() => onDayPress(i)}
                  onLayout={(e) => {
                    const { x, width: w } = e.nativeEvent.layout;
                    buttonLayouts.current[i] = { x, width: w };
                  }}
                >
                  <Text
                    variant="label2Regular"
                    color={
                      isSelected
                        ? "commandPrimaryDefault"
                        : "commandNeutralDefault"
                    }
                  >
                    {dayLabels[i]} · {group.events.length}
                  </Text>
                </Button>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.stickyHeader(theme)}>
        <FlatList
          ref={meetingListRef}
          data={currentDayEvents}
          keyExtractor={(item) => item._id ?? item.meetingId ?? ""}
          renderItem={renderMeetingCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.meetingListContent}
          onViewableItemsChanged={onMeetingViewableItemsChanged}
          viewabilityConfig={meetingViewabilityConfig}
          onScrollToIndexFailed={(info) => {
            meetingListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
        />
        <View style={styles.separator(theme)} />
      </View>

      {/* Prep content area */}
      <Animated.View
        key={`${selectedDayIndex}-${selectedMeetingIndex}`}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.prepContent}
      >
        {pastNotes?.title && (
          <View style={styles.sourceHeader}>
            <Text variant="body2Regular" color="textMuted">
              From Last:
            </Text>
            <View style={styles.sourceRow(theme)}>
              <Pressable
                onPress={handleSourceMeetingPress}
                hitSlop={8}
                style={styles.sourceTitlePressable}
              >
                <Text
                  variant="body2Regular"
                  color="textSecondary"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.sourceTitle}
                >
                  {pastNotes.title}
                </Text>
              </Pressable>
              {pastNotes.startTime && (
                <Text variant="body2Regular" color="textMuted">
                  {format(new Date(pastNotes.startTime), "MMM dd, h:mm a")}
                </Text>
              )}
            </View>
          </View>
        )}

        {isLoadingPrep && !currentPrepOutput ? (
          <MeetingPrepBodySkeleton />
        ) : hasPrepContent ? (
          <>
            <PrepContent
              bulletGist={pastNotes?.bulletGist}
              overview={pastNotes?.overview}
              tasks={prepTasks}
            />
            <FeedbackStarRating
              title="Did you like the meeting prep?"
              category="Meeting Prep"
              source={isDesktop ? "desktop" : "mobile"}
              style={styles.feedback}
            />
          </>
        ) : currentMeeting ? (
          <MeetingPrepNoPrepState />
        ) : null}
      </Animated.View>
    </Animated.ScrollView>
  );
};
