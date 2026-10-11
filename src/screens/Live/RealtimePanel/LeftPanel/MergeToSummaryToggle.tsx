import { Checkbox } from "@/components/Checkbox";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";
import { useMergeToSummary } from "../hooks/useMergeToSummary";

const MERGE_TOOLTIP_LABEL =
  "Your notes will be merged to the meeting summary after the call.";

export const MergeToSummaryToggle: FC<{ meetingId: string }> = ({
  meetingId,
}) => {
  const { shouldMerge, setShouldMerge, isOwner } = useMergeToSummary(meetingId);

  if (!isOwner) return null;

  return (
    <HoverTooltip label={MERGE_TOOLTIP_LABEL} position="bottom" align="end">
      <View style={styles.container}>
        <Checkbox
          value={shouldMerge}
          onValueChange={setShouldMerge}
          size={16}
          nativeID="no-drag"
        />
        <Text variant="body2Regular" color="textMuted">
          Merge to summary
        </Text>
      </View>
    </HoverTooltip>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
