import {
  IconGoogleMeetLogo,
  IconLink2,
  IconMsTeamsLogo,
  IconPanelRight,
  IconSettings,
  IconZoomLogo,
} from "@/assets/svg";
import { DESKTOP_THEME } from "@/styles/color";
import { Text } from "@/components/Typography";
import type { CalendarEventsProps } from "@/features/calendar";
import {
  type CalendarEvents,
  type MeetingStatusData,
  useGetCurrentUserQuery,
} from "@/graphql";
import { createStyles } from "@/styles";
import { useEffect, useMemo, useState, type FC } from "react";
import { Pressable, ScrollView, View, type TextStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SettingSectionLoading } from "../../Home/Settings/SettingSectionLoading";
import { groupByDay } from "../../Home/UpcomingMeetings/utils";
import { useAuth } from "@/features/auth";
import { useListMeetingPreps } from "@/hooks/useListMeetingPreps";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { DesktopUpcomingMeetingItem } from "./DesktopUpcomingMeetingItem";
import { DesktopSideInvitePanel } from "./DesktopSideInvitePanel";
import { DesktopSideButton } from "./DesktopSideButton";
import { HoverTooltip } from "@/components/HoverTooltip";
import { navigationRef } from "@/screens/RootNavigation";
import { RouteNames } from "@/constants";

interface DesktopSideProps extends CalendarEventsProps {
  onMeetingPrepClick?: (event: CalendarEvents) => void;
  liveMeetings?: MeetingStatusData[];
  settingsRef?: React.RefObject<View | null>;
  upcomingMeetingsRef?: React.RefObject<View | null>;
  firstMeetingRef?: React.RefObject<View | null>;
  isInviteOpen?: boolean;
  invitePrefilledUrl?: string;
  onInviteOpenChange?: (open: boolean) => void;
}

const PANEL_WIDTH = 400;

export const DesktopSide: FC<DesktopSideProps> = (props) => {
  const { user: authUser } = useAuth();
  const {
    onMeetingPrepClick,
    liveMeetings = [],
    settingsRef,
    upcomingMeetingsRef,
    firstMeetingRef,
    isInviteOpen: isInviteOpenProp,
    invitePrefilledUrl,
    onInviteOpenChange,
    ...calendarEventsProps
  } = props;
  const { events, isLoadingEvents, error } = calendarEventsProps;

  const { data: dataUser, refetch: refetchCurrentUser } =
    useGetCurrentUserQuery({
      skip: !authUser,
      fetchPolicy: "cache-and-network",
    });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInviteOpenInternal, setIsInviteOpenInternal] = useState(false);
  // Support controlled open state from parent (e.g. tray) or internal toggle
  const isInviteOpen = isInviteOpenProp ?? isInviteOpenInternal;

  // Auto-expand the sidebar when the tray triggers the invite panel so the
  // panel is always visible and not hidden behind the collapsed state.
  useEffect(() => {
    if (isInviteOpenProp) setIsCollapsed(false);
  }, [isInviteOpenProp]);
  const setIsInviteOpen = (open: boolean) => {
    if (onInviteOpenChange) onInviteOpenChange(open);
    else setIsInviteOpenInternal(open);
  };

  const { meetingPrepEventIds } = useListMeetingPreps();

  useWindowFocus(refetchCurrentUser);

  const upcomingEventsOnly = useMemo(() => {
    if (!events) return [];
    const liveMeetingIds = new Set(liveMeetings.map((m) => m.objectId));
    return events.filter((event) => !liveMeetingIds.has(event._id));
  }, [events, liveMeetings]);

  const handleInvitePanelClose = () => setIsInviteOpen(false);

  const eventsByDay = useMemo(
    () => Object.entries(groupByDay(upcomingEventsOnly || [])),
    [upcomingEventsOnly],
  );

  const expandProgress = useSharedValue(isCollapsed ? 0 : 1);
  const [renderContent, setRenderContent] = useState(!isCollapsed);

  useEffect(() => {
    expandProgress.value = withTiming(isCollapsed ? 0 : 1, {
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [isCollapsed, expandProgress]);

  useEffect(() => {
    if (!isCollapsed) {
      setRenderContent(true);
      return;
    }
    // Delay unmounting until the collapse animation finishes
    const timer = setTimeout(() => setRenderContent(false), 300);
    return () => clearTimeout(timer);
  }, [isCollapsed]);

  const wrapperAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(expandProgress.value, [0, 1], [0, PANEL_WIDTH]),
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  return (
    <Animated.View style={[styles.wrapper, wrapperAnimatedStyle]}>
      {/* Collapsed pill showing upcoming count + calendar provider icon */}
      {isCollapsed && (
        <DesktopSideButton
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(false)}
          upcomingCount={upcomingEventsOnly.length}
          isOutlook={dataUser?.user?.profile?.isOutlook ?? undefined}
        />
      )}

      {renderContent && (
        <Animated.View style={[styles.panelWrapper, contentAnimatedStyle]}>
          {/* Fixed top: notetaker info + URL input — outside ScrollView so TextInput receives keyboard events */}
          <View style={styles.fixedTop}>
            <View ref={settingsRef} style={styles.notetakerSection}>
              <View style={styles.notetakerTopRow}>
                <HoverTooltip
                  label="Bot joins calls from Google Meet, Zoom, MS Teams, Webex, Jitsi, Dialpad, Lifesize and GoToMeeting"
                  position="bottom"
                  align="start"
                >
                  <View style={styles.platformIcons}>
                    <IconGoogleMeetLogo width={20} height={20} />
                    <IconZoomLogo width={20} height={20} />
                    <IconMsTeamsLogo width={20} height={20} />
                  </View>
                </HoverTooltip>
                <Pressable
                  onPress={() => setIsCollapsed(true)}
                  testID="no-drag"
                >
                  <IconPanelRight
                    width={20}
                    height={20}
                    color={DESKTOP_THEME.grey700}
                  />
                </Pressable>
              </View>
              <View style={styles.notetakerText}>
                <Text variant="title3Regular" style={styles.textSecondary}>
                  Capture with Notetaker
                </Text>
                <Text
                  variant="title3Regular"
                  style={[styles.textHint, styles.notetakerDescription]}
                >
                  Bot captures audio, video, and speaker names
                </Text>
              </View>
            </View>

            <View style={styles.urlInputSection}>
              <Pressable
                style={styles.urlInputContainer}
                onPress={() => setIsInviteOpen(true)}
                testID="no-drag"
              >
                <IconLink2
                  width={20}
                  height={20}
                  color={DESKTOP_THEME.grey700}
                />
                <Text variant="body2Regular" style={styles.urlPlaceholder}>
                  Paste live meeting URL
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Scrollable meetings list */}
          <ScrollView
            style={styles.meetingsScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.upcomingSection}>
              <View ref={upcomingMeetingsRef} style={styles.upcomingHeader}>
                <Text
                  variant="title3Weight"
                  style={[styles.textSecondary, styles.upcomingTitle]}
                >
                  Upcoming
                </Text>
                <HoverTooltip
                  label="Meeting preference settings"
                  position="bottom"
                  align="end"
                >
                  <Pressable
                    testID="no-drag"
                    onPress={() =>
                      navigationRef.navigate(RouteNames.DesktopSettings, {
                        activeContent: "meeting-preference",
                      })
                    }
                  >
                    <IconSettings
                      width={20}
                      height={20}
                      color={DESKTOP_THEME.grey700}
                    />
                  </Pressable>
                </HoverTooltip>
              </View>

              <View style={styles.meetingList}>
                {eventsByDay.length > 0 ? (
                  eventsByDay.map(([day, dayEvents], dayIndex) => (
                    <View key={day} style={styles.dayGroup}>
                      <Text variant="body2Regular" style={styles.textHint}>
                        {day}
                      </Text>
                      {dayEvents.map((event, eventIndex) => (
                        <View
                          key={event._id}
                          style={styles.meetingItem}
                          ref={
                            dayIndex === 0 && eventIndex === 0
                              ? firstMeetingRef
                              : undefined
                          }
                        >
                          <DesktopUpcomingMeetingItem
                            event={event}
                            onMeetingPrepClick={onMeetingPrepClick}
                            meetingPrepEventIds={meetingPrepEventIds}
                          />
                        </View>
                      ))}
                    </View>
                  ))
                ) : isLoadingEvents ? (
                  <View style={styles.loadingContainer}>
                    <SettingSectionLoading />
                    <SettingSectionLoading />
                    <SettingSectionLoading />
                  </View>
                ) : error ? (
                  <Text variant="body3Regular" style={styles.textHint}>
                    Failed to load meetings
                  </Text>
                ) : (
                  <Text variant="body3Regular" style={styles.textHint}>
                    No upcoming meetings
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          {isInviteOpen && (
            <DesktopSideInvitePanel
              key={invitePrefilledUrl}
              prefilledUrl={invitePrefilledUrl}
              onClose={handleInvitePanelClose}
            />
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = createStyles({
  wrapper: {
    flexGrow: 0,
    flexShrink: 0,
    position: "relative",
    overflow: "visible",
  },
  panelWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: DESKTOP_THEME.grey1100,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 16,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: DESKTOP_THEME.grey1010,
    overflow: "hidden",
    marginRight: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  fixedTop: {
    alignSelf: "stretch",
  },
  meetingsScroll: {
    flex: 1,
    alignSelf: "stretch",
  },
  scrollContent: {
    paddingBottom: 64,
  },
  notetakerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    gap: 16,
  },
  notetakerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6.67,
  },
  notetakerText: {
    gap: 4,
  },
  notetakerDescription: {
    paddingBottom: 2,
  },
  urlInputSection: {
    padding: 20,
  },
  urlInputContainer: {
    height: 40,
    backgroundColor: DESKTOP_THEME.grey900,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey870,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    boxShadow: "0px 2px 2px rgba(16, 24, 40, 0.04)",
  },
  urlPlaceholder: {
    flex: 1,
    color: DESKTOP_THEME.grey700,
  },
  textSecondary: {
    color: DESKTOP_THEME.grey500,
  },
  upcomingTitle: {
    // body{-webkit-font-smoothing:antialiased} flattens perceived weight
    // for light text on this dark background; override locally so 500
    // reads distinctly from 400 without bumping the actual font-weight.
    WebkitFontSmoothing: "subpixel-antialiased",
  } as unknown as TextStyle,
  textHint: {
    color: DESKTOP_THEME.grey700,
  },
  upcomingSection: {
    gap: 0,
  },
  upcomingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
  },
  meetingList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 32,
  },
  dayGroup: {
    gap: 12,
  },
  meetingItem: {
    width: "100%",
  },
  loadingContainer: {
    gap: 12,
  },
});
