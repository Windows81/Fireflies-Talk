import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { Pressable } from "react-native";

export const AskFredUserMessageBubble: FC<{
  children: ReactNode;
  accessibilityLabel: string;
  onLongPress?: () => void;
  variant?: "meeting" | "global";
}> = ({ accessibilityLabel, children, onLongPress, variant = "meeting" }) => {
  const theme = useTheme();

  return (
    <Pressable
      style={[styles.root(theme), variant === "global" && styles.global(theme)]}
      onLongPress={onLongPress}
      accessible
      accessibilityRole={onLongPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={
        onLongPress ? "Long-press to copy your question" : undefined
      }
    >
      {children}
    </Pressable>
  );
};

const styles = createStyles({
  root: (theme) => ({
    alignSelf: "flex-end",
    maxWidth: "85%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.layerMuted,
  }),
  global: (theme) => ({
    maxWidth: "88%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: theme.colors.layerMuted,
  }),
});
