import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

export const SectionHeader: FC<{
  title: string;
  right?: React.ReactNode;
}> = ({ title, right }) => {
  const theme = useTheme();
  return (
    <View style={styles.root(theme)}>
      <View style={styles.content}>
        <Text variant="title3Regular" style={styles.text}>
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    padding: 8,
    borderBottomColor: theme.colors.borderStaticSubtle,
    borderBottomWidth: 1,
    minHeight: 48,
  }),
  text: {
    flex: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    paddingRight: 0,
  },
});
