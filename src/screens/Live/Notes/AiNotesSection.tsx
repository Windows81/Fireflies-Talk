import { type FC } from "react";
import { View } from "react-native";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { createStyles } from "@/styles";
import { ChapterizedLiveNote } from "./ChapterizedLiveNote";
import { ThreeDotBouncingAnim } from "../components/ThreeDotBouncing";

export const AiNotesSection: FC = () => {
  const { formattedChapters } = useLiveScreenContext();

  return (
    <View style={styles.root}>
      {formattedChapters.map((chapter, chapterIndex) => (
        <ChapterizedLiveNote
          key={`chapter-${chapter.title}-${chapterIndex}`}
          chapter={chapter}
          chapterIndex={chapterIndex}
        />
      ))}
      <View style={styles.bouncingContainer}>
        <ThreeDotBouncingAnim />
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    gap: 16,
    minHeight: 250,
  },
  bouncingContainer: {
    marginTop: "auto",
  },
});
