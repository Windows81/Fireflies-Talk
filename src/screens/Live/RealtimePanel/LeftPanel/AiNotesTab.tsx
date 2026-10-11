import { AiNotesSection } from "@/screens/Live/Notes/AiNotesSection";
import { EmptyAiNoteSection } from "@/screens/Live/Notes/EmptyAiNotesSection";
import { useLiveScreenContext } from "@/screens/Live/Context/LiveScreenContext";
import { createStyles } from "@/styles";
import { type FC } from "react";
import { ScrollView } from "react-native";

export const AiNotesTab: FC = () => {
  const { formattedChapters } = useLiveScreenContext();

  if (formattedChapters.length === 0) {
    return <EmptyAiNoteSection />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AiNotesSection />
    </ScrollView>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
});
