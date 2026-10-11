import { createStyles } from "@/styles";
import { useEffect, type FC } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { NOTES_COLUMN_WIDTH, NOTEPAD_VIDEO_PEEK_OFFSET } from "../constants";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { hasPlayableMedia, isAudioOnly } from "../helpers/meeting";
import { NotepadAudioPlayer } from "./NotepadAudioPlayer/NotepadAudioPlayer";

const ROW_MARGIN = 20;
const PLAYER_HEIGHT = 48;
const FADE_DURATION = 200;

export const NotepadBottomBar: FC = () => {
  const { meeting, paneScrollY, mainTab, activeNotesView } =
    useDesktopNotepadContext();

  const audioOnly = isAudioOnly(meeting);
  const hasVideo = hasPlayableMedia(meeting) && !audioOnly;
  const showPlayer = audioOnly || hasVideo;

  // The inline video is only visible on the AI summary pane; on Tasks and
  // My Notes the pane containing it has display:none, so the floating
  // controls should always be shown there.
  const aiSummaryActive = mainTab === "notes" && activeNotesView === "ai";
  const visible =
    audioOnly ||
    (hasVideo &&
      (!aiSummaryActive || paneScrollY >= NOTEPAD_VIDEO_PEEK_OFFSET));

  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (audioOnly) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(visible ? 1 : 0, { duration: FADE_DURATION });
  }, [visible, audioOnly, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!showPlayer) return null;

  return (
    <Animated.View
      style={[styles.row, animatedStyle]}
      pointerEvents={visible ? "box-none" : "none"}
    >
      <NotepadAudioPlayer />
    </Animated.View>
  );
};

const styles = createStyles({
  row: {
    width: "100%",
    maxWidth: NOTES_COLUMN_WIDTH,
    height: PLAYER_HEIGHT,
    paddingHorizontal: ROW_MARGIN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
