import { Text } from "@/components/Typography";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const FeedSectionHeader: FC<{
  label: string;
  subLabel?: string;
  isRecent?: boolean;
}> = ({ isRecent, label, subLabel }) => {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderInfo}>
        <Text variant="body2LongWeight" color="textMuted">
          {isRecent ? "Recent" : label}
        </Text>
        {subLabel && (
          <>
            <Text color="textMuted" variant="bold" fontSize={8}>
              •
            </Text>
            <Text color="textMuted" variant="body2Regular">
              {subLabel}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  separator: { width: 8 },
});
