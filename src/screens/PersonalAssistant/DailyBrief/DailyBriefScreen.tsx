import { IconLink } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Markdown } from "@/components/Markdown";
import { MessageView } from "@/components/Message";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config, DAILY_BRIEF_APP_TITLE } from "@/constants";
import { FeedbackStarRating } from "@/features/feedback-nudge";
import {
  useGetAppOutputsByAppIdQuery,
  type AiAppsMeeting,
  type AppOutputEventFieldsFragment,
} from "@/graphql";
import { useTheme } from "@/styles";
import { copyAsText } from "@/utils/clipboard";
import { isDesktop } from "@/utils/device";
import { pluralize } from "@/utils/pluralize";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format, isToday, isYesterday } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { RouteNames } from "@/constants";
import { useAiAppViewedTracking } from "@/screens/PersonalAssistant/helpers/useAiAppViewedTracking";
import type { ParamList } from "../../types";
import { DailyBriefSkeleton } from "./components/DailyBriefSkeleton";
import { BriefAudioButton } from "./components/BriefAudioButton";
import { BriefMeetingsSheet } from "./components/BriefMeetingsSheet";
import { normalizeFootnoteCitations } from "./helpers/citationHelpers";
import { useCitationRules } from "./helpers/useCitationRules";
import { getMarkdownStyle, styles } from "./DailyBriefScreen.styles";

const MAX_DAYS = 7;

/**
 * Build labels for day buttons. Uses "Today" / "Yesterday" for relative days,
 * otherwise abbreviated month plus day number (e.g. "Apr 18").
 */
function buildDayLabels(outputs: AppOutputEventFieldsFragment[]): string[] {
  return outputs.map((o) => {
    const d = new Date(o.createdAt);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  });
}

export const DailyBriefScreen: FC<
  NativeStackScreenProps<ParamList, "DailyBrief">
> = ({ route }) => {
  const { appId } = route.params;
  const theme = useTheme();
  const navigation = useNavigation();

  const citationRules = useCitationRules();

  const { data, loading, error, refetch } = useGetAppOutputsByAppIdQuery({
    variables: { appId, limit: MAX_DAYS },
  });

  const appOutputs = data?.getAppOutputsByAppId?.appOutputs;
  const outputs = useMemo(
    () => appOutputs?.slice(0, MAX_DAYS) ?? [],
    [appOutputs],
  );

  const dayLabels = useMemo(() => buildDayLabels(outputs), [outputs]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useAiAppViewedTracking({
    appTitle: "Daily Brief",
    appId,
    outputId: outputs[selectedIndex]?.eventId,
  });

  const flatListRef = useRef<FlatList<AppOutputEventFieldsFragment>>(null);
  const buttonScrollRef = useRef<ScrollView>(null);
  const isScrollingFromButton = useRef(false);
  const buttonLayouts = useRef<Record<number, { x: number; width: number }>>(
    {},
  );

  const [sheetMeetings, setSheetMeetings] = useState<AiAppsMeeting[] | null>(
    null,
  );

  const handleCopyLink = useCallback(() => {
    const url = `${Config.DASHBOARD_URL}/welcome/ai-skills/${encodeURIComponent(DAILY_BRIEF_APP_TITLE)}:${appId}`;
    copyAsText(url)
      .then(() => toast({ message: "Daily Brief link copied to clipboard" }))
      .catch(() => toast({ message: "Failed to copy link" }));
  }, [appId]);

  const handleMeetingPress = useCallback(
    (meetingId: string) => {
      setSheetMeetings(null);
      navigation.navigate(RouteNames.Notepad, {
        id: meetingId,
        ref: "daily-brief",
      });
    },
    [navigation],
  );

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [outputs.length]);

  const scrollViewOffset = useRef(0);
  const { width: screenWidth } = useWindowDimensions();

  const onButtonScrollViewScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollViewOffset.current = e.nativeEvent.contentOffset.x;
    },
    [],
  );

  // Scroll horizontal header row only if the button is outside the visible area
  const scrollButtonIntoView = useCallback(
    (index: number) => {
      const layout = buttonLayouts.current[index];
      if (!layout || !buttonScrollRef.current) return;

      const visibleLeft = scrollViewOffset.current;
      const visibleRight = visibleLeft + screenWidth;
      const buttonLeft = layout.x;
      const buttonRight = layout.x + layout.width;

      // If is the last item - scroll to end
      const isLastItem = index === outputs.length - 1;
      if (isLastItem) {
        buttonScrollRef.current.scrollToEnd();
        return;
      }

      // Button is fully visible — do nothing
      if (buttonLeft >= visibleLeft && buttonRight <= visibleRight) return;

      // Scroll so the button is near the left edge with some padding
      const scrollX = Math.max(0, buttonLeft - 20);
      scrollViewOffset.current = scrollX;
      buttonScrollRef.current.scrollTo({ x: scrollX, animated: true });
    },
    [outputs.length, screenWidth],
  );

  const onButtonPress = useCallback(
    (index: number) => {
      isScrollingFromButton.current = true;
      setSelectedIndex(index);
      scrollButtonIntoView(index);
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
      setTimeout(() => {
        isScrollingFromButton.current = false;
      }, 500);
    },
    [scrollButtonIntoView],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (isScrollingFromButton.current) return;
      const first = viewableItems[0];

      if (first?.index != null) {
        setSelectedIndex(first.index);
        scrollButtonIntoView(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
  }).current;

  if (loading && !appOutputs) return <DailyBriefSkeleton />;

  if (error && !appOutputs) {
    return (
      <MessageView
        variant="error"
        title="Could not load Daily Brief"
        action={<Button onPress={() => refetch()}>Retry</Button>}
      />
    );
  }

  if (!outputs.length) {
    return <MessageView title="No brief available yet" />;
  }

  const renderItem = ({
    item,
  }: ListRenderItemInfo<AppOutputEventFieldsFragment>) => {
    const meetingCount = item.meetings?.length ?? 0;
    const date = new Date(item.createdAt);
    const dateLabel = format(date, "MMMM d");
    const dayName = isToday(date)
      ? "Today"
      : isYesterday(date)
        ? "Yesterday"
        : format(date, "EEEE");

    return (
      <View style={styles.briefItem}>
        <View style={styles.dayHeader}>
          <View style={styles.separatorLine(theme)} />
          <Text variant="body2Regular" color="textMuted">
            {dayName}, {dateLabel}
          </Text>
          <Text variant="body2Regular" color="textMuted">
            ·
          </Text>
          <Pressable
            onPress={() => setSheetMeetings(item.meetings)}
            hitSlop={16}
          >
            <Text
              variant="body2Regular"
              color="textMuted"
              style={styles.meetingCountLink}
            >
              {meetingCount} {pluralize("Meeting", meetingCount)}
            </Text>
          </Pressable>
          <Text variant="body2Regular" color="textMuted">
            ·
          </Text>
          <Pressable
            onPress={handleCopyLink}
            hitSlop={8}
            accessibilityLabel="Copy Daily Brief link"
            style={({ pressed }) => [
              styles.copyLinkButton,
              pressed && { backgroundColor: theme.colors.layerStrong },
            ]}
          >
            <IconLink width={14} height={14} color="#98A2B3" />
          </Pressable>
          <BriefAudioButton eventId={item.eventId} audioUrl={item.audioUrl} />
          <View style={styles.separatorLine(theme)} />
        </View>
        {item.output && (
          <View style={styles.briefBody}>
            <Markdown style={getMarkdownStyle(theme)} rules={citationRules}>
              {normalizeFootnoteCitations(item.output)}
            </Markdown>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.headerContainer(theme)}>
        <ScrollView
          ref={buttonScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.buttonsRow}
          onScroll={onButtonScrollViewScroll}
          scrollEventThrottle={16}
        >
          {dayLabels.map((label, i) => {
            const isSelected = i === selectedIndex;
            return (
              <Button
                key={outputs[i].eventId}
                variant="outlined"
                size="sm"
                style={
                  isSelected
                    ? styles.selectedButton(theme)
                    : styles.unselectedButton
                }
                onPress={() => onButtonPress(i)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  buttonLayouts.current[i] = { x, width };
                }}
              >
                <Text
                  variant="label2Regular"
                  color={
                    isSelected
                      ? theme.name === "dark"
                        ? "commandContrastDefault"
                        : "commandPrimaryDefault"
                      : "commandNeutralDefault"
                  }
                >
                  {label}
                </Text>
              </Button>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        ref={flatListRef}
        data={outputs}
        keyExtractor={(item) => item.eventId}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 200);
        }}
        ListFooterComponent={
          <FeedbackStarRating
            title="Did you like the summary?"
            category="Daily Brief"
            source={isDesktop ? "desktop" : "mobile"}
            style={styles.feedback}
          />
        }
      />
      <BriefMeetingsSheet
        isOpen={!!sheetMeetings}
        close={() => setSheetMeetings(null)}
        meetings={sheetMeetings ?? []}
        onMeetingPress={handleMeetingPress}
      />
    </>
  );
};
