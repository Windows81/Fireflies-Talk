import { Select } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import {
  useSetMeetingLanguageMutation,
  useToggleUpcomingEventMutation,
  type CalendarEvents,
} from "@/graphql";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { format } from "date-fns";
import { type FC, useEffect, useRef, useState } from "react";
import { View, Pressable, Platform } from "react-native";
import {
  useGetLanguageNameByCode,
  useLanguageOptions,
} from "@/features/language";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { MeetingPrepHoverCard } from "./MeetingPrepHoverCard";

const renderCurrentOption = (option: { value: string }) => {
  return option.value.toUpperCase();
};

export const DesktopUpcomingMeetingItem: FC<{
  event: CalendarEvents;
  isJoiningAll?: boolean;
  onMeetingPrepClick?: (event: CalendarEvents) => void;
  meetingPrepEventIds?: Set<string> | null;
}> = ({ event, isJoiningAll, onMeetingPrepClick, meetingPrepEventIds }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverAnchor, setHoverAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const cardWrapperRef = useRef<View>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const HOVER_CARD_WIDTH = 388;
  const HOVER_CARD_GUTTER = 12;
  // Small delay so the mouse can travel from the card to the hover modal
  // without the modal disappearing mid-transit.
  const HOVER_CLOSE_DELAY_MS = 120;
  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const openHover = () => {
    cancelClose();
    const node = cardWrapperRef.current as unknown as HTMLElement | null;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setHoverAnchor({
      top: rect.top,
      left: rect.left - HOVER_CARD_WIDTH - HOVER_CARD_GUTTER,
    });
    setIsHovered(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, HOVER_CLOSE_DELAY_MS);
  };
  const hoverProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: openHover,
          onMouseLeave: scheduleClose,
        }
      : {};
  useEffect(() => cancelClose, []);
  const [toggleUpcomingEvent, { loading: loadingToggle }] =
    useToggleUpcomingEventMutation({
      errorPolicy: "none",
      onCompleted(data) {
        const toastMessage = data.toggleUpcomingEvent.fredAdded
          ? "Fred is invited to the meeting to record and take notes."
          : "Fred will not join and record this meeting.";
        toast(toastMessage);
      },
      onError(err) {
        toast({
          title: "Could not toggle meeting",
          message: err.message,
          type: "error",
        });
      },
      optimisticResponse({ fredAdded }) {
        return {
          __typename: "Mutation",
          toggleUpcomingEvent: {
            ...event,
            fredAdded: fredAdded,
          },
        };
      },
    });

  const languageOptions = useLanguageOptions();
  const getLanguageNameByCode = useGetLanguageNameByCode();

  const fredAdded = !!event.fredAdded;

  const onToggleFred = () => {
    const value = !fredAdded;
    tracker.track(TRACKING_EVENTS.JOIN_SETTING_TOGGLED, {
      enabled: value,
    });
    toggleUpcomingEvent({
      variables: {
        meetingId: event._id as string,
        fredAdded: value,
        iCalUID: event.iCalUID,
        scheduleType: "desktop",
        calendarType: event.calendarType,
      },
    });
  };

  const { user } = useAuth();

  const currentLanguage =
    event.customLanguage ||
    event.ownerProfile?.preferredLanguage ||
    user?.preferredLanguage ||
    "en";

  const [setMeetingLanguage, { loading: loadingSetLanguage }] =
    useSetMeetingLanguageMutation({
      onCompleted(data) {
        if (!data.setMeetingLanguage?.customLanguage) return;

        const languageName = getLanguageNameByCode(
          data.setMeetingLanguage.customLanguage,
        );

        toast(`Meeting language changed to '${languageName}'`);
      },
      onError(error) {
        toast({
          title: "Could not change meeting language",
          message: error.message,
        });
      },
      optimisticResponse({ language }) {
        return {
          __typename: "Mutation",
          setMeetingLanguage: {
            __typename: "CalendarEvents",
            ...event,
            customLanguage: language,
          },
        };
      },
    });

  const handleChangeLanguage = (language: string) => {
    setMeetingLanguage({
      variables: {
        meetingId: event.meetingId as string,
        language,
      },
    });
  };

  const isAllowedToUpdateLanguage = Boolean(event.isMeetingAdmin);

  const eventDate = event.date ? new Date(event.date) : null;

  const hasMeetingPrep =
    !!meetingPrepEventIds &&
    ((!!event._id && meetingPrepEventIds.has(event._id)) ||
      meetingPrepEventIds.has(event.meetingId as string));

  const isActive = isHovered || fredAdded;

  const meetingContent = (
    <View
      style={[
        styles.meeting,
        isActive ? styles.meetingActive : styles.meetingDefault,
        fredAdded ? styles.meetingWithLanguage : undefined,
      ]}
      {...hoverProps}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.leading}>
          <View style={styles.textContent}>
            <Text
              variant="body2Regular"
              numberOfLines={1}
              style={[
                styles.title,
                {
                  color: isActive
                    ? DESKTOP_THEME.grey500
                    : DESKTOP_THEME.grey700,
                },
              ]}
            >
              {event.title}
            </Text>
            <Text variant="body2Regular" style={styles.timeText}>
              {!!eventDate && format(eventDate, "h:mm a")}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {isHovered && (
            <Text variant="body3Regular" style={styles.inviteHint}>
              Invite Notetaker
            </Text>
          )}
          <Switch
            value={fredAdded}
            onValueChange={onToggleFred}
            size="sm"
            loading={loadingToggle || isJoiningAll}
            disabled={loadingToggle || isJoiningAll || !event.userCanToggle}
            aria-label={`Adding Fred to the meeting "${event.title}"`}
          />
        </View>
      </View>

      {/* Bottom row - language only when bot is added */}
      {fredAdded && (
        <View style={styles.bottomRow}>
          <View style={styles.dropdown}>
            <Select
              value={currentLanguage}
              onValueChange={handleChangeLanguage}
              options={languageOptions}
              renderCurrentOption={renderCurrentOption}
              size="sm"
              inline
              disabled={
                !isAllowedToUpdateLanguage ||
                !event.meetingId ||
                loadingSetLanguage
              }
              showSearch
            />
          </View>
        </View>
      )}
    </View>
  );

  if (hasMeetingPrep && onMeetingPrepClick) {
    return (
      <View style={styles.container} ref={cardWrapperRef}>
        <Pressable
          onPress={() => onMeetingPrepClick(event)}
          style={styles.pressable}
        >
          {meetingContent}
        </Pressable>

        {/* Rich preview card on hover (web only) — rendered via portal */}
        {Platform.OS === "web" && isHovered && (
          <MeetingPrepHoverCard
            event={event}
            anchor={hoverAnchor}
            onMouseEnter={openHover}
            onMouseLeave={scheduleClose}
            onPress={() => {
              cancelClose();
              setIsHovered(false);
              onMeetingPrepClick(event);
            }}
          />
        )}
      </View>
    );
  }

  return meetingContent;
};

const styles = createStyles({
  container: {
    position: "relative",
    width: "100%",
  },
  pressable: {
    cursor: "pointer",
    flex: 1,
  },
  meeting: {
    borderRadius: 10,
    width: "100%",
    overflow: "hidden",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: 16,
    gap: 16,
  },
  meetingDefault: {
    backgroundColor: DESKTOP_THEME.grey1050,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey1010,
    paddingBottom: 16,
  },
  meetingActive: {
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    paddingBottom: 16,
  },
  meetingWithLanguage: {
    paddingBottom: 12,
  },
  topRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    gap: 20,
  },
  leading: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  textContent: {
    alignSelf: "stretch",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },
  title: {
    overflow: "hidden",
  },
  timeText: {
    color: DESKTOP_THEME.grey700,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  bottomRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  dropdown: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  inviteHint: {
    color: DESKTOP_THEME.grey700,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 0,
  },
});
