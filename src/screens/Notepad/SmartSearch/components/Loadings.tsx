import { SkeletonLoading } from "@/components/Loading";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { styles as filterOptionsStyles, getColumnStyle } from "./FilterOptions";

const LoadingNode: FC<{
  contentWidth: number;
  columnNum: number;
}> = ({ contentWidth, columnNum }) => {
  return (
    <View style={[styles.root, getColumnStyle(columnNum)]}>
      <View style={styles.leading}>
        <SkeletonLoading width={8} height={8} />
        <SkeletonLoading width={contentWidth} height={20} />
      </View>
      <SkeletonLoading width={20} height={20} />
    </View>
  );
};

export const loadingNodesAiFilterNodes = (
  <View style={filterOptionsStyles.filterOptions}>
    <LoadingNode contentWidth={41} columnNum={2} />
    <LoadingNode contentWidth={49} columnNum={2} />
    <LoadingNode contentWidth={61} columnNum={2} />
    <LoadingNode contentWidth={64} columnNum={2} />
    <LoadingNode contentWidth={74} columnNum={2} />
    <LoadingNode contentWidth={64} columnNum={2} />
  </View>
);

export const loadingSentimentFilterNodes = (
  <View style={filterOptionsStyles.filterOptions}>
    <LoadingNode contentWidth={84} columnNum={1} />
    <LoadingNode contentWidth={84} columnNum={1} />
    <LoadingNode contentWidth={74} columnNum={1} />
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  leading: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
});
