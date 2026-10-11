import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SearchIconCircle } from "./SearchIconCircle";

export const EmptyState: FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <SearchIconCircle />
      <Text variant="title3Weight" color="textSecondary" style={styles.title}>
        {title}
      </Text>
      {!!description && (
        <Text variant="body2Regular" color="textMuted" style={styles.title}>
          {description}
        </Text>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
    gap: 8,
  },
  title: {
    textAlign: "center",
  },
});
