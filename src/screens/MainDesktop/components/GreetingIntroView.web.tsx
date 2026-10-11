import { IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { VideoTutorialModal } from "@/components/VideoPlayerModal";
import { createStyles } from "@/styles";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const introBackgroundPng = require("./intro-background.png");
import { DESKTOP_THEME } from "@/styles/color";
import { useState, type FC } from "react";
import { View, Pressable, Image } from "react-native";
import { getNameParts } from "@/utils/user";
import { DASHBOARD_TUTORIAL_VIDEO_URL } from "@/constants";

const BANNER_BG = DESKTOP_THEME.purple1200;
const BANNER_BORDER = DESKTOP_THEME.purple1000;

const introVideoWrapperStyle = { maxWidth: 960, aspectRatio: 16 / 9 };

interface GreetingIntroViewProps {
  userName: string;
  onClose: () => void;
}

export const GreetingIntroView: FC<GreetingIntroViewProps> = ({
  userName,
  onClose,
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <View style={styles.banner}>
      <View style={styles.textBlock}>
        <Text variant="title1Weight" style={styles.title}>
          Welcome Aboard, {getNameParts(userName).firstName}!
        </Text>
        <Text variant="body2Regular" style={styles.description}>
          Learn how to get notified to record calls, bot-less recordings and
          real-time assistance during meetings.
        </Text>
      </View>
      <Pressable
        style={styles.visual}
        onPress={() => setIsVideoModalOpen(true)}
      >
        <Image
          source={introBackgroundPng}
          style={styles.introPlayButton}
          resizeMode="cover"
        />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.closeButtonPressed,
        ]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <IconX width={20} height={20} color={DESKTOP_THEME.grey100} />
      </Pressable>

      {isVideoModalOpen && (
        <VideoTutorialModal
          url={DASHBOARD_TUTORIAL_VIDEO_URL}
          videoWrapperStyle={introVideoWrapperStyle}
          onClose={() => setIsVideoModalOpen(false)}
        />
      )}
    </View>
  );
};

const styles = createStyles({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 32,
    padding: 16,
    backgroundColor: BANNER_BG,
    borderWidth: 1,
    borderColor: BANNER_BORDER,
    borderRadius: 12,
    width: "100%",
  },
  textBlock: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  title: {
    color: DESKTOP_THEME.grey400,
    lineHeight: 28,
  },
  description: {
    color: DESKTOP_THEME.grey500,
    lineHeight: 20,
  },
  visual: {
    width: 167,
    height: 99,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  introPlayButton: {
    width: 167,
    height: 99,
  },
});
