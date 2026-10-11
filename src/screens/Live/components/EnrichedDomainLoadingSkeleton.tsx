import { type FC } from "react";
import { View } from "react-native";
import { SkeletonLoading } from "@/components/Loading";
import { createStyles } from "@/styles";

export const EnrichedDomainLoadingSkeleton: FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      {/* Title skeleton */}
      <View style={styles.skeletonTitleContainer}>
        <SkeletonLoading width={150} height={12} />
      </View>

      {/* Description skeletons */}
      <View style={styles.skeletonDescriptionContainer}>
        <SkeletonLoading width="100%" height={12} />
        <SkeletonLoading width="100%" height={12} />
        <SkeletonLoading width="70%" height={12} />
      </View>

      {/* Headline items */}
      <View style={styles.skeletonHeadlineItem}>
        <View>
          <SkeletonLoading width={20} height={12} />
        </View>
        <View style={styles.skeletonHeadlineContent}>
          <SkeletonLoading width="100%" height={12} />
          <SkeletonLoading width="100%" height={12} />
          <SkeletonLoading width="40%" height={12} />
        </View>
      </View>

      <View style={styles.skeletonHeadlineItem}>
        <View>
          <SkeletonLoading width={20} height={12} />
        </View>
        <View style={styles.skeletonHeadlineContent}>
          <SkeletonLoading width="100%" height={12} />
          <SkeletonLoading width="100%" height={12} />
          <SkeletonLoading width="60%" height={12} />
        </View>
      </View>

      <View style={styles.skeletonHeadlineItem}>
        <View>
          <SkeletonLoading width={20} height={12} />
        </View>
        <View style={styles.skeletonHeadlineContent}>
          <SkeletonLoading width="100%" height={12} />
          <SkeletonLoading width="100%" height={12} />
          <SkeletonLoading width="30%" height={12} />
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  skeletonContainer: {
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  skeletonTitleContainer: {
    paddingVertical: 14,
  },
  skeletonDescriptionContainer: {
    flexDirection: "column",
    gap: 8,
  },
  skeletonHeadlineItem: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    width: "100%",
  },
  skeletonHeadlineContent: {
    flexDirection: "column",
    gap: 8,
    width: "100%",
    flex: 1,
  },
});
