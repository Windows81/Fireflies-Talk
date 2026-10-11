import { Text } from "@/components/Typography";
import { useDownloads } from "@/features/downloads";
import { useTheme } from "@/styles";
import { Paths } from "expo-file-system";
import prettyBytes from "pretty-bytes";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const StorageSummaryCard: FC = () => {
  const theme = useTheme();
  const firefliesBytes = useDownloads((s) => s.getTotalMediaSize());

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.layerStrong }]}>
      <Text variant="label2Regular" color="textMuted">
        Used by Fireflies
      </Text>
      <View style={styles.numbersRow}>
        <Text fontSize={28} fontWeight="700" color="textPrimary">
          {prettyBytes(firefliesBytes)}
        </Text>
        <Text variant="body2Regular" color="textMuted">
          {prettyBytes(Paths.availableDiskSpace)} free
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  numbersRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
});
