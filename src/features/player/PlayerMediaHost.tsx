import { VideoView } from "expo-video";
import { useContext, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { PlayerContext } from "./PlayerContext";

/**
 * Mounts the player's media element off-screen without any visible controls.
 * Audio-only meetings need this so the source loads and playback works on web,
 * where expo-video relies on a mounted VideoView, while a custom UI drives it.
 */
export const PlayerMediaHost: FC = () => {
  const { videoViewRef, videoPlayer } = useContext(PlayerContext);

  return (
    <View style={styles.host} pointerEvents="none">
      <VideoView
        ref={videoViewRef}
        player={videoPlayer}
        nativeControls={false}
        contentFit="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
});
