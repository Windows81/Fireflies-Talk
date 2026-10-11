import { createStyles } from "@/styles";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState, type FC } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import videoSource from "../assets/accessibility-permission.mp4";
import { CROP, cornerRadiusForWidth } from "../permissionVideoCrop";

const percent = (value: number): `${number}%` => `${value * 100}%`;

/**
 * The System Settings walkthrough shown beside the permissions step: where the
 * Accessibility toggle lives and what granting it looks like. Muted and looping,
 * so it reads as an illustration rather than something to press play on.
 */
export const AccessibilityPermissionVideo: FC = () => {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    // Autoplay is only allowed while muted, and there is nothing to hear.
    p.muted = true;
    p.play();
  });

  // The source is set before the view mounts, so the play above can be dropped.
  useEffect(() => {
    player.play();
    return () => {
      player.pause();
    };
  }, [player]);

  const [frameWidth, setFrameWidth] = useState(0);
  const onFrameLayout = (event: LayoutChangeEvent) =>
    setFrameWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.wrapper}>
      {/* VideoView renders a bare <video> on web, which ignores its own border
        radius, so the rounding and the crop are both clipped by this parent. */}
      <View
        onLayout={onFrameLayout}
        style={[
          styles.frame,
          { borderRadius: cornerRadiusForWidth(frameWidth) },
        ]}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="fill"
          nativeControls={false}
        />
      </View>
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  // 565px of the design's 822px-wide panel, held to that share so the video
  // scales with the window instead of overflowing a narrow one.
  frame: {
    width: "68.7%",
    maxWidth: 565,
    maxHeight: "80%",
    aspectRatio: CROP.aspectRatio,
    overflow: "hidden" as const,
  },
  video: {
    position: "absolute" as const,
    left: percent(CROP.left),
    top: percent(CROP.top),
    width: percent(CROP.width),
    height: percent(CROP.height),
  },
});
