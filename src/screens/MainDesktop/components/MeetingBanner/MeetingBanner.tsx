import { useState, type FC } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { type CalendarEvents, type MeetingStatusData } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useMeetingPrepSummary } from "../../hooks/useMeetingPrepSummary";
import { MeetingBannerHeading } from "./MeetingBannerHeading";
import { MeetingPrepActionItems } from "./MeetingPrepActionItems";
import { MeetingBannerActions } from "./MeetingBannerActions";
import { ViewNotesButton } from "./ViewNotesButton";

const PREP_SUMMARY_CHAR_LIMIT = 120;
/** Below this card width, actions wrap to a right-aligned row under the content. */
const ACTIONS_WRAP_BREAKPOINT = 440;
const TAG_HIDE_BREAKPOINT = 520;

export type MeetingBannerState = "upcoming" | "live" | "live-joined";

interface MeetingBannerProps {
  /** Calendar event for upcoming/live calendar meetings. */
  event?: CalendarEvents;
  /** Backend live meeting for ad-hoc/add-to-live calls with no calendar event. */
  liveMeeting?: MeetingStatusData;
  state?: MeetingBannerState;
  /** True when the user has already joined the meeting. */
  userJoined?: boolean;
  /** Force-hide the prep section (e.g. when several cards are stacked). */
  hidePrep?: boolean;
  onMeetingPrepClick?: (event: CalendarEvents) => void;
}

/**
 * Unified meeting banner used for every home banner case. Shows the prep
 * summary when the meeting has it, and adapts the trailing action:
 *  - "upcoming"/"live" calendar meeting → join actions (Join, or Invite
 *    Notetaker + Join and Take Notes depending on the bot)
 *  - "live-joined" meeting already being recorded → View Notes
 */
export const MeetingBanner: FC<MeetingBannerProps> = ({
  event,
  liveMeeting,
  state = "upcoming",
  userJoined = false,
  hidePrep = false,
  onMeetingPrepClick,
}) => {
  const { truncatedSummary, taskCount, participants, hasContent } =
    useMeetingPrepSummary(event, liveMeeting, PREP_SUMMARY_CHAR_LIMIT);

  const isLive = state === "live" || state === "live-joined";
  const isJoined = state === "live-joined";

  const startMs = event?.date
    ? new Date(event.date).getTime()
    : (liveMeeting?.startTime ?? null);
  const endMs = event?.endDate
    ? new Date(event.endDate).getTime()
    : (liveMeeting?.endTime ?? null);
  const notesMeetingId = liveMeeting?.objectId ?? event?.meetingId ?? undefined;
  // Hidden for the live-joined compact card, and whenever the home stacks more
  // than one card (prep detail is too noisy in a multi-card list).
  const showPrep = hasContent && !isJoined && !hidePrep;

  const [cardWidth, setCardWidth] = useState<number | null>(null);
  const handleLayout = (e: LayoutChangeEvent) => {
    setCardWidth(e.nativeEvent.layout.width);
  };
  const isNarrow = cardWidth !== null && cardWidth < ACTIONS_WRAP_BREAKPOINT;
  // Keep the LIVE tag always; only the (less critical) UPCOMING tag is dropped.
  const showStateTag =
    isLive || cardWidth === null || cardWidth >= TAG_HIDE_BREAKPOINT;

  const openPrep = () => {
    if (!event) return;
    tracker.track(TRACKING_EVENTS.MEETING_PREP_OPENED, {
      from: "desktop-home-banner",
      isOrganizer: event.isOrganizer,
      fredAdded: event.fredAdded,
      isValidMeeting: event.isValidMeeting,
      manuallyToggled: event.manuallyToggled,
    });
    onMeetingPrepClick?.(event);
  };

  const actions =
    isJoined || !event ? (
      <ViewNotesButton meetingId={notesMeetingId} />
    ) : (
      <MeetingBannerActions
        event={event}
        isLive={isLive}
        liveMeetingId={liveMeeting?.objectId ?? undefined}
        userJoined={userJoined}
      />
    );

  return (
    <View
      style={[styles.card, isJoined && styles.cardLiveJoined]}
      onLayout={handleLayout}
    >
      <View style={[styles.meetingRow, isNarrow && styles.meetingRowStacked]}>
        <MeetingBannerHeading
          title={event?.title ?? liveMeeting?.title}
          url={event?.url ?? liveMeeting?.url}
          startMs={startMs}
          endMs={endMs}
          isLive={isLive}
          showStateTag={showStateTag}
        />
        <View style={[styles.actions, isNarrow && styles.actionsStacked]}>
          {actions}
        </View>
      </View>

      {showPrep && (
        <View style={styles.prepSection}>
          <Text variant="body2LongRegular" style={styles.prepText}>
            <Text variant="body2LongRegular" style={styles.prepLead}>
              In the last meeting{" "}
            </Text>
            {!!truncatedSummary && (
              <Text variant="body2LongRegular" style={styles.prepBody}>
                {`–– ${truncatedSummary} `}
              </Text>
            )}
            <Text
              variant="body2Regular"
              style={styles.viewPrep}
              onPress={openPrep}
            >
              View Prep
            </Text>
          </Text>
          <MeetingPrepActionItems
            participants={participants}
            taskCount={taskCount}
          />
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  card: {
    width: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 24,
    padding: 20,
    borderRadius: 12,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
  },
  // Live meeting the user has joined: compact card with a live (red) border.
  cardLiveJoined: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 8,
    borderColor: DESKTOP_THEME.red1000,
  },
  meetingRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  // Narrow cards: stack the actions onto their own row, pinned to the right.
  meetingRowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 16,
  },
  actions: {
    flexShrink: 0,
  },
  actionsStacked: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  prepSection: {
    width: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 20,
  },
  prepText: {
    width: "100%",
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  prepLead: {
    color: DESKTOP_THEME.grey500,
    lineHeight: 24,
  },
  prepBody: {
    color: DESKTOP_THEME.grey700,
    lineHeight: 24,
  },
  viewPrep: {
    color: DESKTOP_THEME.grey500,
    textDecorationLine: "underline",
  },
});
