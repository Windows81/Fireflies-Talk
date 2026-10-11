import type { FC, ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface VideoPlayerModalProps {
  setContainerRef: (node: View | null) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  renderCloseButton: () => ReactNode;
  videoWrapperStyle?: StyleProp<ViewStyle>;
}

export const VideoPlayerModal: FC<VideoPlayerModalProps> = ({
  setContainerRef,
  isPlaying,
  onPlayPause,
  renderCloseButton,
  videoWrapperStyle,
}) => (
  <Modal visible animationType="fade" transparent statusBarTranslucent>
    <View style={styles.overlay}>
      {renderCloseButton()}
      <View style={[styles.videoWrapper, videoWrapperStyle]}>
        <View ref={setContainerRef} style={styles.videoContainer} />
        {!isPlaying && (
          <Pressable style={styles.playOverlay} onPress={onPlayPause}>
            <View style={styles.playButton}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoWrapper: {
    width: "90%",
    position: "relative",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
});
