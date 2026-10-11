import { Text } from "@/components/Typography";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const TitleHeader: FC<{ title: string; description?: string }> = ({
  title,
  description,
}) => {
  return (
    <View style={styles.header}>
      <Text variant="heading4Weight">{title}</Text>
      {!!description && (
        <Text variant="body1Regular" color="textSecondary">
          {description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 32,
    gap: 16,
  },
});
