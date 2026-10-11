import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FormattedChapter } from "../Context/useLiveInsights";
import { type FC } from "react";
import { View } from "react-native";

interface ChapterizedLiveNoteProps {
  chapter: FormattedChapter;
  chapterIndex: number;
}

export const ChapterizedLiveNote: FC<ChapterizedLiveNoteProps> = ({
  chapter,
  chapterIndex,
}) => {
  const theme = useTheme();

  return (
    <View
      key={`chapter-${chapter.title}-${chapterIndex}`}
      style={styles.noteGroup}
    >
      <View style={styles.groupHeader}>
        <Text
          variant="body2LongWeight"
          color="textSecondary"
          style={styles.titleText}
        >
          {chapter.emoji}{" "}
          <Text variant="body2LongWeight" color="textSecondary">
            {chapter.title}
          </Text>{" "}
          <Text variant="body2LongRegular" color="textHint">
            {chapter.timeRangeFormatted}
          </Text>
        </Text>
      </View>

      <View style={styles.notesList}>
        {chapter.notes.map((note, noteIndex) => (
          <View
            key={`note-${noteIndex}-${chapterIndex}`}
            style={styles.noteItem}
          >
            <View style={styles.bullet(theme)} />
            <Text variant="body2LongRegular" color="textSecondary">
              {note.note}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  noteGroup: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    gap: 4,
  },
  notesList: {
    marginLeft: 14,
    gap: 8,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingLeft: 8,
  },
  bullet: (theme) => ({
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textHint,
    marginTop: 12,
  }),
});
