import { PlayerComponent, PlayerMediaHost } from "@/features/player";
import { useNotepadPlayer } from "@/screens/Notepad/utils/player";
import { createStyles } from "@/styles";
import { View } from "react-native";
import { NOTEPAD_VIDEO_HEIGHT } from "../../constants";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { hasPlayableMedia, isAudioOnly } from "../../helpers/meeting";

export const NotepadSummaryVideo = () => {
  const { meeting } = useDesktopNotepadContext();

  useNotepadPlayer(meeting);

  // No video and no audio: render no player at all.
  if (!hasPlayableMedia(meeting)) return null;

  if (isAudioOnly(meeting)) {
    return <PlayerMediaHost />;
  }

  return (
    <View style={styles.video}>
      <PlayerComponent videoHidden={false} playButtonOnly />
    </View>
  );
};

const styles = createStyles({
  video: {
    height: NOTEPAD_VIDEO_HEIGHT,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
});
