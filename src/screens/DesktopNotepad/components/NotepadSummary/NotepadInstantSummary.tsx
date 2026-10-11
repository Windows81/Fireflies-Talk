import { Markdown } from "@/components/Markdown";
import { useStreamingText } from "@/hooks/useStreamingText";
import { transformContent } from "@/screens/Notepad/utils/transform-content";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { useNotepadTimestampLink } from "../../hooks/useNotepadTimestampLink";
import type { DesktopNotepadMeeting } from "../../types";
import { notepadSummaryMarkdownStyle } from "./summaryMarkdownStyle";

interface Props {
  meeting: DesktopNotepadMeeting;
  content: string;
  isCompleted: boolean;
}

/**
 * Streams the post-recording instant summary using the same markdown renderer
 * as the settled notepad summary sections.
 */
export const NotepadInstantSummary: FC<Props> = ({
  meeting,
  content,
  isCompleted,
}) => {
  const displayedContent = useStreamingText(content, isCompleted);
  const markdown = transformContent(meeting, displayedContent);
  const onLinkPress = useNotepadTimestampLink(meeting.id);

  if (!markdown.trim()) return null;

  return (
    <View style={styles.root}>
      <Markdown
        color="textSecondary"
        onLinkPress={onLinkPress}
        style={notepadSummaryMarkdownStyle}
      >
        {markdown}
      </Markdown>
    </View>
  );
};

const styles = createStyles({
  root: {
    width: "100%",
  },
});
