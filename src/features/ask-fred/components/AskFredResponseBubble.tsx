import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { View } from "react-native";

export const AskFredResponseBubble: FC<{
  children: ReactNode;
  variant?: "meeting" | "global";
}> = ({ children, variant = "meeting" }) => {
  const theme = useTheme();

  return (
    <View style={[styles.root, variant === "global" && styles.global(theme)]}>
      {children}
    </View>
  );
};

const styles = createStyles({
  root: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    height: "auto",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  global: (theme) => ({
    width: "95%",
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    backgroundColor: theme.colors.layerSubtle,
  }),
});
