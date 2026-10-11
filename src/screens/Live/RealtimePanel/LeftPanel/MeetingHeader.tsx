import { HoverTooltip } from "@/components/HoverTooltip";
import { TextInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import { useMeetingCalendarEventLink } from "@/features/calendar";
import { useMeetingCapabilities } from "@/features/meeting/utils/permissions";
import { type Meeting } from "@/graphql";
import { createStyles, FontStyles } from "@/styles";
import { type FC, type ReactNode, useCallback, useState } from "react";
import type { TextStyle } from "react-native";
import { Pressable, View } from "react-native";
import { useMeetingHeader } from "../hooks/useMeetingHeader";
import { CalendarSuggestionBanner } from "./CalendarSuggestionBanner";
import { CalendarEventPill } from "./pills/CalendarEventPill";
import { LanguagePill } from "./pills/LanguagePill";
import { ParticipantsPill } from "./pills/ParticipantsPill";

const titleEllipsisStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
} as TextStyle;

export const MeetingHeader: FC<{
  meeting: Meeting;
  rightAccessory?: ReactNode;
}> = ({ meeting, rightAccessory }) => {
  const { canEditMetadata } = useMeetingCapabilities(meeting);
  const { title, isEditing, beginEdit, draft, setDraft, commit } =
    useMeetingHeader(meeting);
  // Shared so the banner and the calendar pill observe the same link state.
  const calendarLink = useMeetingCalendarEventLink(meeting.id, meeting.title);
  const [isSuggestionHidden, setIsSuggestionHidden] = useState(false);

  const hideSuggestion = useCallback(() => {
    setIsSuggestionHidden(true);
  }, []);

  const titleElement = (
    <Title
      title={title}
      isEditing={isEditing}
      isEditable={canEditMetadata}
      beginEdit={beginEdit}
      draft={draft}
      setDraft={setDraft}
      commit={commit}
    />
  );

  return (
    <View style={styles.root}>
      {!isEditing && !isSuggestionHidden ? (
        <CalendarSuggestionBanner
          meetingTitle={title}
          calendarLink={calendarLink}
          onAccept={hideSuggestion}
          onDismiss={hideSuggestion}
          titleFallback={titleElement}
        />
      ) : (
        titleElement
      )}
      <View style={styles.pillsRow}>
        <View style={styles.pills}>
          <ParticipantsPill meeting={meeting} />
          <CalendarEventPill meeting={meeting} calendarLink={calendarLink} />
          <LanguagePill meeting={meeting} />
        </View>
        <View style={styles.rightAccessorySlot}>{rightAccessory}</View>
      </View>
    </View>
  );
};

const Title: FC<{
  title: string;
  isEditing: boolean;
  isEditable: boolean;
  beginEdit: () => void;
  draft: string;
  setDraft: (value: string) => void;
  commit: () => void;
}> = ({ title, isEditing, isEditable, beginEdit, draft, setDraft, commit }) => {
  if (isEditing) {
    return (
      <TextInput
        value={draft}
        onValueChange={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        variant="inlined"
        autoFocus
        textStyle={[FontStyles.heading4Weight, titleEllipsisStyle]}
        style={styles.titleInput}
      />
    );
  }

  const titleText = (
    <Text
      variant="heading4Weight"
      color="commandNeutralDefault"
      numberOfLines={1}
    >
      {title}
    </Text>
  );

  if (!isEditable) {
    return titleText;
  }

  return (
    <Pressable onPress={beginEdit} style={styles.titlePress}>
      <HoverTooltip label="Rename" position="bottom" align="start">
        {titleText}
      </HoverTooltip>
    </Pressable>
  );
};

const styles = createStyles({
  root: {
    gap: 16,
    marginTop: 56,
  },
  titleInput: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  titlePress: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexShrink: 1,
    minWidth: 0,
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rightAccessorySlot: {
    minHeight: 36,
    justifyContent: "center",
    flexShrink: 0,
  },
  pills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
});
