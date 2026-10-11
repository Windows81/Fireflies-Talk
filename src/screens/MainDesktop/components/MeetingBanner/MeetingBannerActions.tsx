import { useState, type FC } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/Typography";
import { toast } from "@/components/Toast";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { openURL } from "@/features/navigation/utils";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useToggleUpcomingEventMutation, type CalendarEvents } from "@/graphql";
import {
  meetingDetectionApi,
  getPlatformFromUrl,
} from "@/features/desktop-meeting-detection";
import {
  toRecordingSourceAttendees,
  toRecordingSourceCalendarWindow,
  useRecordActionsContext,
} from "@/features/live-record";
import { openLiveNotes } from "./openLiveNotes";

/** Keep the "joined" claim alive until the meeting ends, with a sane fallback. */
const FALLBACK_JOIN_TTL_MS = 60 * 60 * 1000;

interface BannerButtonProps {
  label: string;
  onPress: () => void;
  variant: "filled" | "ghost";
  disabled?: boolean;
}

const BannerButton: FC<BannerButtonProps> = ({
  label,
  onPress,
  variant,
  disabled,
}) => {
  const [hovered, setHovered] = useState(false);
  const isFilled = variant === "filled";

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        isFilled && styles.buttonFilled,
        isFilled && hovered && styles.buttonFilledHovered,
        !isFilled && hovered && styles.buttonGhostHovered,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text variant="body2Weight" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
};

interface MeetingBannerActionsProps {
  event: CalendarEvents;
  /** True when the meeting is currently in progress (not just upcoming). */
  isLive?: boolean;
  /** Backend meeting id of the bot's live call, used to open its realtime panel. */
  liveMeetingId?: string;
  /** True when the user has already joined the meeting call. */
  userJoined?: boolean;
}

export const MeetingBannerActions: FC<MeetingBannerActionsProps> = ({
  event,
  isLive = false,
  liveMeetingId,
  userJoined = false,
}) => {
  const fredAdded = !!event.fredAdded;
  const { startRecording, startInputs } = useRecordActionsContext();

  const [toggleUpcomingEvent, { loading }] = useToggleUpcomingEventMutation({
    onCompleted(data) {
      toast(
        data.toggleUpcomingEvent.fredAdded
          ? "Fred is invited to the meeting to record and take notes."
          : "Fred will not join and record this meeting.",
      );
    },
    onError(err) {
      toast({
        title: "Could not invite notetaker",
        message: err.message,
        type: "error",
      });
    },
    optimisticResponse({ fredAdded: nextFredAdded }) {
      return {
        __typename: "Mutation",
        toggleUpcomingEvent: { ...event, fredAdded: nextFredAdded },
      };
    },
  });

  const inviteNotetaker = () => {
    if (fredAdded) return;
    tracker.track(TRACKING_EVENTS.JOIN_SETTING_TOGGLED, { enabled: true });
    toggleUpcomingEvent({
      variables: {
        meetingId: event._id as string,
        fredAdded: true,
        iCalUID: event.iCalUID,
        scheduleType: "desktop",
        calendarType: event.calendarType,
      },
    });
  };

  const eventPlatform = event.url
    ? (getPlatformFromUrl(event.url) ?? undefined)
    : undefined;

  // Claim this meeting so the banner adapts its actions (no redundant "Join").
  const markJoined = () => {
    if (!event._id || !event.url) return;
    const end = event.endDate ? new Date(event.endDate).getTime() : 0;
    const until = end > Date.now() ? end : Date.now() + FALLBACK_JOIN_TTL_MS;
    meetingDetectionApi.claimCalendarMeeting({
      eventId: event._id,
      url: event.url,
      platform: eventPlatform,
      until,
    });
  };

  const startCalendarNotes = () => {
    startRecording({
      ...startInputs,
      title: event.title?.trim() || startInputs.title,
      recordingSource: {
        type: "manual",
        trigger: "calendar_event",
        calendarEventId: event._id ?? undefined,
        iCalUID: event.iCalUID ?? undefined,
        meetingUrl: event.url ?? undefined,
        platform: eventPlatform,
        title: event.title ?? undefined,
        attendees: toRecordingSourceAttendees(event.attendees),
        ...toRecordingSourceCalendarWindow(event),
      },
    });
  };

  const joinMeeting = () => {
    if (!event.url) return;
    markJoined();
    openURL(event.url, { newTab: true });
  };

  const joinAndTakeNotes = () => {
    markJoined();
    if (event.url) openURL(event.url, { newTab: true });
    startCalendarNotes();
  };

  const viewNotes = () => {
    if (liveMeetingId) openLiveNotes(liveMeetingId);
  };

  const inviteDisabled = loading || !event.userCanToggle;

  // A notetaker is already capturing this call — never show "Invite Notetaker".
  // Once the user has joined, promote "View Notes" to primary.
  const hasLiveNotes = isLive && !!liveMeetingId;

  if (hasLiveNotes) {
    if (userJoined) {
      return (
        <View style={styles.container}>
          <BannerButton
            label="Take Notes"
            variant="ghost"
            onPress={startCalendarNotes}
          />
          <BannerButton
            label="View Notes"
            variant="filled"
            onPress={viewNotes}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <BannerButton
          label="Take Notes"
          variant="ghost"
          onPress={startCalendarNotes}
        />
        <BannerButton label="Join" variant="filled" onPress={joinMeeting} />
      </View>
    );
  }

  if (userJoined) {
    return (
      <View style={styles.container}>
        {!fredAdded && (
          <BannerButton
            label="Invite Notetaker"
            variant="ghost"
            onPress={inviteNotetaker}
            disabled={inviteDisabled}
          />
        )}
        <BannerButton
          label="Take Notes"
          variant="filled"
          onPress={startCalendarNotes}
        />
      </View>
    );
  }

  if (fredAdded) {
    return (
      <View style={styles.container}>
        <BannerButton label="Join" variant="filled" onPress={joinMeeting} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerButton
        label="Invite Notetaker"
        variant="ghost"
        onPress={inviteNotetaker}
        disabled={inviteDisabled}
      />
      <BannerButton
        label="Join and Take Notes"
        variant="filled"
        onPress={joinAndTakeNotes}
        disabled={inviteDisabled}
      />
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  button: {
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFilled: {
    backgroundColor: DESKTOP_THEME.purple1100,
  },
  buttonFilledHovered: {
    backgroundColor: DESKTOP_THEME.purple1000,
  },
  buttonGhostHovered: {
    backgroundColor: DESKTOP_THEME.grey950,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: DESKTOP_THEME.purple400,
    letterSpacing: -0.16,
  },
});
