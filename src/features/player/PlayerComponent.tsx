import { imageNoMeetingVideo } from "@/assets/images";
import { useIsLoginPopupVisible } from "@/features/auth";
import { createStyles, useTheme } from "@/styles";
import { Image } from "expo-image";
import { VideoView } from "expo-video";
import type { FC, PropsWithChildren } from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { PlayerComponentElements } from "./PlayerComponentElements";
import { PlayerContext } from "./PlayerContext";

const fullScreenOptions = {
  enable: true,
  autoExitOnRotate: false,
};

export const PlayerComponentContainer: FC<
  PropsWithChildren<{
    videoHidden?: boolean;
  }>
> = ({ children, videoHidden }) => {
  const theme = useTheme();
  const { options } = useContext(PlayerContext);
  const isAudio = options?.sources?.[0]?.type?.startsWith("audio/");
  return (
    <View style={styles.videoContainer(theme)}>
      <View
        style={[
          !videoHidden && styles.videoAspectRatio,
          !videoHidden && isAudio && styles.videoAspectRatioAudio,
          videoHidden && styles.videoHiddenContainer,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export const PlayerComponent: FC<{
  videoHidden: boolean;
  setVideoHidden?: (hidden: boolean) => void;
  playButtonOnly?: boolean;
}> = ({ videoHidden, setVideoHidden, playButtonOnly }) => {
  const { videoViewRef, statusRef, options, player, videoPlayer } =
    useContext(PlayerContext);

  const isLoginPopupVisible = useIsLoginPopupVisible();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const onFullscreenEnter = useCallback(() => {
    statusRef.current.isFullscreen = true;
    setIsFullscreen(true);
    player.emit("fullscreenchange");
  }, [player, statusRef]);

  const onFullscreenExit = useCallback(() => {
    statusRef.current.isFullscreen = false;
    setIsFullscreen(false);
    player.emit("fullscreenchange");
  }, [player, statusRef]);

  useEffect(() => {
    if (player && isLoginPopupVisible) {
      player.pause();
    }
  }, [player, isLoginPopupVisible]);

  const isAudioSource = options?.sources[0]?.type?.startsWith("audio/");

  return (
    <View style={styles.root}>
      {isAudioSource && (
        <Image
          source={imageNoMeetingVideo}
          aria-label="No Meeting Video"
          style={styles.noMeetingVideo}
          transition={300}
          cachePolicy="none"
        />
      )}
      <VideoView
        ref={videoViewRef}
        player={videoPlayer}
        fullscreenOptions={fullScreenOptions}
        allowsPictureInPicture
        contentFit="contain"
        nativeControls={isFullscreen}
        onFullscreenEnter={onFullscreenEnter}
        onFullscreenExit={onFullscreenExit}
        style={[
          styles.innerVideo,
          (isAudioSource || videoHidden) && styles.hideInnerVideo,
        ]}
      />
      <PlayerComponentElements
        videoHidden={videoHidden}
        setVideoHidden={setVideoHidden}
        isAudioSource={isAudioSource}
        playButtonOnly={playButtonOnly}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    backgroundColor: "#000000",
    width: "100%",
    height: "100%",
  },
  noMeetingVideo: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  video: {
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  innerVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  hideInnerVideo: {
    display: "none",
  },
  videoContainer: (theme) => ({
    width: "100%",
    backgroundColor: theme.colors.layerBrandLight2,
    flexDirection: "row",
    justifyContent: "center",
  }),
  videoAspectRatio: {
    aspectRatio: 16 / 9,
    width: "100%",
    maxWidth: 640,
    marginHorizontal: "auto",
  },
  videoAspectRatioAudio: {
    aspectRatio: 24 / 9,
  },
  videoHiddenContainer: {
    height: 100,
    width: "100%",
    overflow: "hidden",
  },
});
