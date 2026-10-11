import type { ClientSpeakerInsight } from "@/features/live";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { Text } from "@/components/Typography";
import { IconFred } from "@/assets/svg";

type SpeakerInsightNudgeProps = {
  insight: ClientSpeakerInsight;
};

export const SpeakerInsightNudge: FC<SpeakerInsightNudgeProps> = ({
  insight,
}) => {
  return (
    <View style={styles.container}>
      <IconFred width={20} height={20} />
      <Text
        variant="body2Regular"
        color="textSecondary"
        numberOfLines={1}
        style={styles.message}
      >
        {insight.message}
      </Text>
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
    maxWidth: 480,
  },
  message: {
    flexShrink: 1,
  },
});
