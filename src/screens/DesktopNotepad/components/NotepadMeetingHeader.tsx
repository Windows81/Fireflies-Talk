import { createStyles } from "@/styles";
import { View } from "react-native";
import { CalendarEventPill } from "./CalendarEvent/CalendarEventPill";
import { NotepadLanguagePill } from "./LanguageSelector/NotepadLanguagePill";
import { NotepadMeetingTitle } from "./NotepadMeetingTitle";
import { NotepadSummaryVideo } from "./NotepadSummary/NotepadSummaryVideo";

export const NotepadMeetingHeader = () => {
  return (
    <View>
      <NotepadSummaryVideo />
      <View style={styles.header}>
        <NotepadMeetingTitle />
        <View style={styles.pills}>
          <CalendarEventPill />
          <NotepadLanguagePill />
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  header: {
    gap: 16,
    paddingTop: 56,
  },
  pills: {
    flexDirection: "row",
    gap: 8,
  },
});
