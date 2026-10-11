import { ShimmerText } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  ASK_FRED_LOADING_MESSAGES,
  ASK_FRED_LOADING_MESSAGES_LIVE,
} from "../constants/config";
import { FredTyping } from "./FredTyping";

interface AskFredAnswerLoaderProps {
  isLiveMeeting?: boolean;
}

export const AskFredAnswerLoader: FC<AskFredAnswerLoaderProps> = ({
  isLiveMeeting = false,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = isLiveMeeting
    ? ASK_FRED_LOADING_MESSAGES_LIVE
    : ASK_FRED_LOADING_MESSAGES;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  return (
    <View style={styles.container}>
      <FredTyping />
      <ShimmerText color="textSecondary" variant="body2Regular">
        {loadingMessages[messageIndex]}
      </ShimmerText>
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
