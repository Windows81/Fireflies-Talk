import { Text } from "@/components/Typography";
import type { Soundbite } from "@/graphql";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const BiteDescription: FC<{ bite: Soundbite }> = ({ bite }) => {
  return (
    <View style={styles.root}>
      {bite.summary ? (
        <Text variant="body1LongRegular">{bite.summary}</Text>
      ) : (
        <Text variant="body1LongRegular" color="textMuted">
          No summary
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexShrink: 1,
    flexDirection: "column",
    gap: 24,
    paddingTop: 18,
  },
  title: {
    marginBottom: 12,
  },
});
