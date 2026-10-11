import { Text } from "@/components/Typography";
import type { GroupedCaption } from "@/components/Transcript";
import { createStyles } from "@/styles";
import { toHHMMSS } from "@/utils/time";
import type { FC } from "react";
import { View } from "react-native";

export const RecordTranscriptRow: FC<{ caption: GroupedCaption }> = ({
  caption,
}) => (
  <View style={styles.row} role="listitem">
    <View style={styles.header}>
      <Text variant="title2Weight" color="textSecondary" numberOfLines={1}>
        {caption.speakerName}
      </Text>
      <Text variant="body1Regular" color="textMuted">
        {toHHMMSS(caption.startTime)}
      </Text>
    </View>
    <Text variant="body1LongRegular" color="textSecondary">
      {caption.text}
    </Text>
  </View>
);

const styles = createStyles({
  row: {
    gap: 6,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
});
