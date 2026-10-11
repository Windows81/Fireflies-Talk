import { Select } from "@/components/Input";
import { SkeletonLoading } from "@/components/Loading";
import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import {
  useSetMeetingLanguageMutation,
  useToggleUpcomingEventMutation,
  type CalendarEvents,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { format } from "date-fns";
import type { FC } from "react";
import { View } from "react-native";
import { WebConfButton } from "./WebConfButton";
import {
  useGetLanguageNameByCode,
  useLanguageOptions,
} from "@/features/language";

const renderCurrentOption = (option: { value: string }) => {
  return option.value.toUpperCase();
};

export const UpcomingMeetingItem: FC<{
  event: CalendarEvents;
  isJoiningAll?: boolean;
  compact?: boolean;
  selected?: boolean;
}> = ({ event, isJoiningAll, compact, selected }) => {
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
    toggleUpcomingEvent({
      variables: {
        meetingId: event._id as string,
        fredAdded: value,
        iCalUID: event.iCalUID,
        scheduleType: "mobile",
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

  const theme = useTheme();

  const eventDate = event.date ? new Date(event.date) : null;

  return (
    <View
      style={[
        styles.item(theme),
        compact && styles.itemCompact,
        selected && styles.itemSelected(theme),
      ]}
    >
      <View style={styles.itemHead}>
        <View style={styles.itemHeadLeading}>
          <Text variant="body2Regular" color="textMuted">
            {!!eventDate && format(eventDate, "hh:mm a")}
          </Text>
          <Text variant="body2Regular" color="textSecondary" numberOfLines={2}>
            {event.title}
          </Text>
        </View>
        {!compact && (
          <View style={styles.footer}>
            <View style={styles.language}>
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
            <WebConfButton url={event.url} />
          </View>
        )}
      </View>
      <Switch
        value={fredAdded}
        onValueChange={onToggleFred}
        loading={loadingToggle || isJoiningAll}
        disabled={loadingToggle || isJoiningAll || !event.userCanToggle}
        aria-label={`Adding Fred to the meeting "${event.title}"`}
      />
    </View>
  );
};

export const LoadingUpcomingMeetingItem: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.item(theme)}>
      <View style={styles.itemHead}>
        <View style={[styles.itemHeadLeading, styles.itemHeadLeadingLoading]}>
          <SkeletonLoading width={80} height={14} variant="rect" />
          <SkeletonLoading width={200} height={16} variant="rect" />
        </View>
        <View style={styles.language}>
          <SkeletonLoading width={60} height={14} variant="rect" />
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  item: (theme) => ({
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.layerMuted,
    alignSelf: "stretch",
  }),
  itemCompact: {
    alignItems: "center",
  },
  itemSelected: (theme) => ({
    borderWidth: 1,
    borderColor: theme.colors.borderStaticBrand,
  }),
  itemHead: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  itemHeadLeading: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  itemHeadLeadingLoading: {
    gap: 6,
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  language: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
});
