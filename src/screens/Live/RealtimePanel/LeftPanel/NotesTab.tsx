import { type Meeting } from "@/graphql";
import { useManualNotes } from "@/features/manual-notes";
import { useMeetingPrepSummary } from "@/screens/MainDesktop/hooks/useMeetingPrepSummary";
import { createStyles } from "@/styles";
import { type FC } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ManualNotesEditor } from "../../Notes/ManualNotesEditor";
import { AiNotesTab } from "./AiNotesTab";
import { MeetingPrepBanner } from "./MeetingPrepBanner";
import { useDismissedPrepBanner } from "./useDismissedPrepBanner";
import { type NotesView } from "./NotesNavigationMenu";

const TRANSITION_MS = 90;

// Keep the notes editor content clear of the floating recording controls
// (~bottom 32 + ~50px control bar) so they never overlap.
const RECORDING_CONTROLS_CLEARANCE = 112;

export const NotesTab: FC<{
  meeting: Meeting;
  view: NotesView;
  onChangeView: (view: NotesView) => void;
}> = ({ meeting, view, onChangeView }) => {
  const { notes, setNotes } = useManualNotes(meeting.id);
  const { hasContent } = useMeetingPrepSummary(
    undefined,
    undefined,
    undefined,
    meeting.id,
  );
  const { isDismissed, dismiss } = useDismissedPrepBanner(meeting.id);
  const showPrepBanner = hasContent && !isDismissed;

  return (
    <View style={styles.root}>
      {showPrepBanner && (
        <MeetingPrepBanner
          meetingId={meeting.id}
          onPress={() => onChangeView("meeting-prep")}
          onDismiss={dismiss}
        />
      )}
      {view === "my-notes" ? (
        <Animated.View
          key="my-notes"
          style={styles.panel}
          entering={FadeIn.duration(TRANSITION_MS)}
          exiting={FadeOut.duration(TRANSITION_MS)}
        >
          <ScrollView
            style={styles.notesScroll}
            contentContainerStyle={styles.notesScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ManualNotesEditor
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your meeting notes…"
              minHeight={120}
            />
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View
          key="ai-notes"
          style={styles.panel}
          entering={FadeIn.duration(TRANSITION_MS)}
          exiting={FadeOut.duration(TRANSITION_MS)}
        >
          <AiNotesTab />
        </Animated.View>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    gap: 28,
  },
  panel: {
    flex: 1,
  },
  notesScroll: {
    flex: 1,
  },
  notesScrollContent: {
    flexGrow: 1,
    paddingBottom: RECORDING_CONTROLS_CLEARANCE,
  },
});
