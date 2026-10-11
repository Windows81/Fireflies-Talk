import { SkeletonLoading } from "@/components/Loading";
import type { FC } from "react";
import { View } from "react-native";
import { styles } from "./styles";

export const SettingSectionLoading: FC = () => {
  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <SkeletonLoading width={120} height={16} variant="rect" />
        <SkeletonLoading width={240} height={16} variant="rect" />
      </View>
    </View>
  );
};
