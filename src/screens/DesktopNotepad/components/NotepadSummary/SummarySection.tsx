import { Markdown } from "@/components/Markdown";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { useCallback, type FC } from "react";
import { View } from "react-native";
import { useNotepadTimestampLink } from "../../hooks/useNotepadTimestampLink";
import { useUpdateNotepadSummary } from "../../hooks/useUpdateNotepadSummary";
import type { DesktopNotepadSection } from "../../types";
import { NotepadSummaryEditor } from "./NotepadSummaryEditor";
import { notepadSummaryMarkdownStyle } from "./summaryMarkdownStyle";

// The overview section arrives titled "Notes"; it reads as noise above the
// summary body, so we drop that header.
const HIDDEN_TITLES = new Set(["notes"]);

interface Props {
  section: DesktopNotepadSection;
  meetingId: string;
  canEdit: boolean;
}

export const SummarySection: FC<Props> = ({ section, meetingId, canEdit }) => {
  const { save } = useUpdateNotepadSummary(meetingId);
  const onLinkPress = useNotepadTimestampLink(meetingId);
  const showTitle = !HIDDEN_TITLES.has(section.title.trim().toLowerCase());

  const handleChange = useCallback(
    (markdown: string) => save(section.key, markdown),
    [save, section.key],
  );

  return (
    <View style={styles.section}>
      {showTitle && (
        <Text variant="body1Regular" color="textSecondary" style={styles.title}>
          {section.title}
        </Text>
      )}
      {canEdit ? (
        <NotepadSummaryEditor
          initialMarkdown={section.rawValue}
          onChange={handleChange}
        />
      ) : (
        <Markdown
          color="textSecondary"
          onLinkPress={onLinkPress}
          style={notepadSummaryMarkdownStyle}
        >
          {section.value}
        </Markdown>
      )}
    </View>
  );
};

const styles = createStyles({
  section: {
    gap: 8,
  },
  title: {
    fontWeight: "700",
  },
});
