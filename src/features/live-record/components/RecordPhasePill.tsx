import { LoadingSpinner } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { RECORD_STARTING_LABEL } from "../record-phase.store";

/**
 * What the controls pill shows while the recorder starts up: spinner + label,
 * on the same pill shell. No animation of its own — the spinner already says
 * work is happening.
 */
export const RecordPhasePill: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <LoadingSpinner color={theme.colors.textMuted} />
      <Text variant="body2Regular" color="textSecondary" numberOfLines={1}>
        {RECORD_STARTING_LABEL}
      </Text>
    </View>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingRight: 6,
  },
});
