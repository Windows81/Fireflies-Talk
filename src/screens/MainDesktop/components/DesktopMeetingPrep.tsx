import { type FC } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { format, isSameYear, formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/Avatar";
import { type CalendarEvents } from "@/graphql";
import { SelectPopover, type SelectOption } from "@/components/Input";
import { useBooleanState } from "@/utils/states";
import { getExternalDomains } from "@/utils/email";
import { useAuth } from "@/features/auth";
import { MeetingPrepBody } from "./MeetingPrepBody";

interface DesktopMeetingPrepProps {
  event: CalendarEvents;
}

export const DesktopMeetingPrep: FC<DesktopMeetingPrepProps> = ({ event }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const userEmail = user?.email;

  const hasExternalDomains =
    getExternalDomains(event, userEmail || "").length > 0;

  const [isAttendeesPopoverOpen, openAttendeesPopover, closeAttendeesPopover] =
    useBooleanState();

  // Owner shown in the info card comes from the calendar event, independent of
  // the prep query.
  const { name, picture, email } =
    event.lastMeeting?.organizerProfile || event.ownerProfile || {};

  const eventDate = event.date ? new Date(event.date) : null;
  const attendees = event.attendees || [];
  const attendeesCount = attendees.length > 0 ? attendees.length - 1 : 0;

  // Create options for attendees popover
  const attendeesOptions: SelectOption<string>[] = attendees
    .filter((attendee) => !attendee?.organizer) // Exclude organizer
    .map((attendee) => ({
      label: attendee?.email || "Unknown",
      value: attendee?.email || "",
      left: <Avatar name={attendee?.email || "?"} size={24} shape="square" />,
    }));

  const formatMeetingDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const isInSameYearVal = isSameYear(date, new Date());
    const dateFormat = isInSameYearVal
      ? "MMM d, h:mm a"
      : "MMM d, yyyy · h:mm a";
    return format(date, dateFormat);
  };

  const upcomingMeetingDate = eventDate
    ? formatMeetingDate(eventDate.toISOString())
    : null;
  const timeUntilMeeting = eventDate
    ? formatDistanceToNow(eventDate, { addSuffix: true })
    : "";

  return (
    <View style={styles.root(theme)}>
      <ScrollView
        nativeID="desktop-meeting-prep-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Meeting Info Section */}
          <View style={styles.meetingInfoCard}>
            <View style={styles.section}>
              <View style={styles.headerRow}>
                <View style={styles.titleSection}>
                  {/* Meeting Title */}
                  <Text variant="heading5Weight" color="textPrimary">
                    {event.title}
                  </Text>

                  {/* Owner Info and Date */}
                  <View style={styles.metaRow}>
                    {picture && (name || email) && (
                      <>
                        <Avatar
                          name={name || email}
                          picture={picture}
                          size={24}
                          shape="square"
                        />
                        <Text variant="body2LongRegular" color="textMuted">
                          {name || email}
                        </Text>
                        {attendeesCount > 0 && (
                          <Pressable onPress={openAttendeesPopover}>
                            <Text
                              variant="body2LongRegular"
                              color="textMuted"
                              style={styles.attendeesLink}
                            >
                              +{attendeesCount}
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}
                    {upcomingMeetingDate && (
                      <Text variant="body2LongRegular" color="textMuted">
                        {upcomingMeetingDate}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.headerRight}>
                  {/* Time Until Meeting Badge */}
                  {timeUntilMeeting && (
                    <View style={styles.timeBadge(theme)}>
                      <Text variant="body3Regular" color="textBrand">
                        {timeUntilMeeting.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <MeetingPrepBody
            meetingId={event.meetingId}
            iCalUID={event.iCalUID}
            lastMeetingFallback={event.lastMeeting}
            hasExternalDomains={hasExternalDomains}
          />
        </View>
      </ScrollView>

      {/* Attendees Popover */}
      <SelectPopover
        isOpen={isAttendeesPopoverOpen}
        close={closeAttendeesPopover}
        onValueChange={() => {}} // No action needed, just for viewing
        value=""
        options={attendeesOptions}
        showSearch
        dialogVariant="bottomSheet"
        style={styles.selectPopover}
      />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.textContrast,
  }),
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  container: {
    gap: 32,
    maxWidth: 720,
    alignSelf: "center",
    width: "100%",
  },
  section: {
    gap: 20,
  },
  meetingInfoCard: {
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  titleSection: {
    flex: 1,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  timeBadge: (theme) => ({
    backgroundColor: theme.colors.layerBrand,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  }),
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  attendeesLink: {
    textDecorationLine: "underline",
  },
  selectPopover: {
    maxHeight: "80%",
  },
});
