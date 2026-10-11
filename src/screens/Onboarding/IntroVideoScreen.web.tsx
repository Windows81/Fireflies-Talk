import { RouteNames } from "@/constants";
import {
  DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY,
  setLocalUserFlag,
} from "@/features/user-flags";
import { useEventListener } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { RootNavigation } from "@/screens/RootNavigation";
import type { ParamList } from "../types";
import introVideoSource from "@/assets/intro-video.mp4";

export const IntroVideoScreen: FC<
  NativeStackScreenProps<ParamList, "IntroVideo">
> = () => {
  const videoPlayer = useVideoPlayer(introVideoSource, (player) => {
    player.loop = false;
    player.play();
  });

  const goToNextScreen = useCallback(() => {
    setLocalUserFlag(DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY, true);
    RootNavigation.navigate(RouteNames.MainDesktop);
  }, []);

  useEventListener(videoPlayer, "playToEnd", goToNextScreen);

  useEffect(() => {
    videoPlayer.play();
    return () => {
      videoPlayer.pause();
    };
  }, [videoPlayer]);

  return (
    <View style={styles.container}>
      <VideoView
        player={videoPlayer}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
