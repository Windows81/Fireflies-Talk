import { SkeletonLoading } from "@/components/Loading";
import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";

export const LoadingTopicTrackers: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <View style={styles.titleContainer}>
        <SkeletonLoading width="100%" height="100%" />
      </View>
      <View style={styles.propsContainer}>
        <SkeletonLoading width={80} height="100%" />
        <View style={styles.spacer} />
        <SkeletonLoading width={90} height="100%" />
        <View style={styles.spacer} />
        <SkeletonLoading width={60} height="100%" />
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerDefault,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
  }),
  spacer: {
    width: 10,
  },
  propsContainer: {
    width: "100%",
    height: 20,
    marginTop: 20,
    flexDirection: "row",
  },
  titleContainer: {
    width: 150,
    height: 25,
  },
});
