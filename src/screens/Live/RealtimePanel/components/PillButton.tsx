import { Text } from "@/components/Typography";
import { useWebHover } from "@/components/Button";
import { createStyles, useTheme } from "@/styles";
import { forwardRef } from "react";
import type { View } from "react-native";
import { Pressable } from "react-native";

interface PillButtonProps {
  label: string;
  onPress?: () => void;
  active?: boolean;
}

export const PillButton = forwardRef<View, PillButtonProps>(function PillButton(
  { label, onPress, active = false },
  ref,
) {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();
  const isFilled = active || isHovered;

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={[styles.pill(theme), isFilled && styles.pillFilled(theme)]}
      {...webHoverProps}
    >
      <Text
        variant="body2Regular"
        color={active ? "textPrimary" : "textHint"}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = createStyles({
  pill: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    // Allow the pill to shrink and its label to ellipsize when the header runs
    // out of room. minWidth:0 is required for flex children to shrink below
    // their content size.
    flexShrink: 1,
    minWidth: 0,
  }),
  label: {
    flexShrink: 1,
  },
  pillFilled: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
});
