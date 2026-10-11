import { IconList } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth/store";
import { createStyles, useTheme } from "@/styles";
import { ScrollView, View } from "react-native";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { isMeetingOwner } from "../../helpers/meeting";
import { useNotepadManualNotes } from "../../hooks/useNotepadManualNotes";
import { useSyncedPaneScroll } from "../../hooks/useSyncedPaneScroll";
import { NOTEPAD_HEADER_CONTENT_GAP } from "../../constants";
import { NotepadMeetingHeader } from "../NotepadMeetingHeader";
import { MergeNotesButton } from "./MergeNotesButton";

const MY_NOTES_LABEL = "My Notes";

export const NotepadMyNotes = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { meeting, mainTab, activeNotesView } = useDesktopNotepadContext();
  const { scrollRef, onScroll } = useSyncedPaneScroll(
    mainTab === "notes" && activeNotesView === "my",
  );
  const { notes, hasMerged, canMerge } = useNotepadManualNotes(meeting.id);
  const isOwner = isMeetingOwner(meeting, user);

  return (
    <ScrollView
      ref={scrollRef}
      nativeID="notepad-pane-scroll"
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <NotepadMeetingHeader />
      <View style={styles.notes}>
        <View style={styles.header}>
          <View style={styles.label}>
            <IconList
              width={20}
              height={20}
              color={theme.colors.commandNeutralDefault}
            />
            <Text variant="body1Regular" color="commandNeutralDefault">
              {MY_NOTES_LABEL}
            </Text>
          </View>
          {isOwner && !hasMerged && (
            <MergeNotesButton meetingId={meeting.id} canMerge={canMerge} />
          )}
        </View>
        <Text variant="body1Regular" color="textSecondary" style={styles.body}>
          {notes}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = createStyles({
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    gap: NOTEPAD_HEADER_CONTENT_GAP,
    paddingTop: 16,
    paddingBottom: 96,
  },
  notes: {
    gap: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  body: {
    lineHeight: 28,
  },
});
