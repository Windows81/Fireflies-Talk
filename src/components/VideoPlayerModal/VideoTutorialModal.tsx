import { IconX } from "@/assets/svg";
import { useDesktopVideoPlayer } from "@/hooks/useDesktopVideoPlayer";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "../Typography";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface VideoTutorialModalProps {
  url: string;
  onClose: () => void;
  videoWrapperStyle?: StyleProp<ViewStyle>;
}

/**
 * Plain tutorial video in a fullscreen overlay with a labelled close button.
 * For walkthrough videos that just play — the onboarding demo drives the
 * recorder while it plays and keeps its own modal.
 */
export const VideoTutorialModal: FC<VideoTutorialModalProps> = ({
  url,
  onClose,
  videoWrapperStyle,
}) => {
  const { setContainerRef, isPlaying, handlePlayPause, handleClose } =
    useDesktopVideoPlayer({ url, onClose });

  return (
    <VideoPlayerModal
      setContainerRef={setContainerRef}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      videoWrapperStyle={videoWrapperStyle}
      renderCloseButton={() => (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close video"
        >
          <IconX width={20} height={20} color={DESKTOP_THEME.grey100} />
          <Text variant="body1Regular" style={styles.label}>
            Close
          </Text>
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 24,
    right: 24,
    zIndex: 9999,
    elevation: 9999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: withAlpha(DESKTOP_THEME.grey1200, 0.75),
    borderWidth: 1,
    borderColor: withAlpha(DESKTOP_THEME.grey100, 0.25),
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    color: DESKTOP_THEME.grey100,
  },
});
