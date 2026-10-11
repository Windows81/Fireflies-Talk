import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { Pressable } from "react-native";

export const CHIP_SELECTED_COLOR = "commandContrastDefault" as const;
export const CHIP_UNSELECTED_COLOR = "commandNeutralDefault" as const;

export const Chip: FC<
  PropsWithChildren<{
    onPress: () => void;
    selected: boolean;
    /** Use "button" for chips that open a sheet, "radio" for exclusive pairs. */
    role?: "checkbox" | "radio" | "button";
    /** Optional element rendered before the label (e.g. a hash/lock icon). */
    leading?: ReactNode;
    /** Optional element rendered after the label (e.g. a chevron). */
    trailing?: ReactNode;
  }>
> = ({ selected, onPress, children, role = "checkbox", leading, trailing }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.root,
        selected ? styles.selected(theme) : styles.unselected(theme),
        (pressed || isHovered) &&
          (selected
            ? styles.selectedActive(theme)
            : styles.unselectedActive(theme)),
      ]}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8 }}
      role={role}
      aria-checked={role === "button" ? undefined : selected}
      {...webHoverProps}
    >
      {leading}
      <Text
        variant={selected ? "label2Weight" : "label2Regular"}
        color={selected ? CHIP_SELECTED_COLOR : CHIP_UNSELECTED_COLOR}
      >
        {children}
      </Text>
      {trailing}
    </Pressable>
  );
};

const styles = createStyles({
  root: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  unselected: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
    borderColor: theme.colors.borderInteractiveDefault,
  }),
  unselectedActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
    borderColor: theme.colors.borderInteractiveHover,
  }),
  selected: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
    borderColor: theme.colors.interactivePrimaryDefault,
  }),
  selectedActive: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryHover,
    borderColor: theme.colors.interactivePrimaryHover,
  }),
});
