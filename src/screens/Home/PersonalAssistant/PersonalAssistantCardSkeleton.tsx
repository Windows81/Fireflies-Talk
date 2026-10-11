import { SkeletonLoading } from "@/components/Loading";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

export const PersonalAssistantCardSkeleton: FC = () => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.miscellaneousSkeletonBackground },
      ]}
    >
      <SkeletonLoading width={20} height={20} variant="rounded" />
      <View style={styles.footer}>
        <SkeletonLoading width="70%" height={14} />
        <SkeletonLoading width="50%" height={12} />
      </View>
    </View>
  );
};

const styles = createStyles({
  card: {
    width: 145,
    height: 118,
    borderRadius: 8,
    padding: 18,
    justifyContent: "space-between",
  },
  footer: {
    gap: 6,
  },
});
