import { IconCheck } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { getReadableTextColor } from "@/utils/color";
import type { FC } from "react";
import { View } from "react-native";

/** The task checkbox as pure decoration, for rows nothing can toggle. */
export const TaskCheckboxBox: FC<{
  checked?: boolean;
  hovered?: boolean;
  disabled?: boolean;
}> = ({ checked = false, hovered = false, disabled = false }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.box(theme),
        hovered && !disabled && styles.boxHovered(theme),
        checked && styles.boxChecked(theme),
        disabled && styles.boxDisabled(theme),
      ]}
    >
      {checked && (
        <IconCheck
          width={12}
          height={12}
          color={getReadableTextColor(theme.colors.interactivePrimaryHover)}
        />
      )}
    </View>
  );
};

const styles = createStyles({
  box: (theme) => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveHover,
    backgroundColor: theme.colors.interactiveNeutral3Default,
    alignItems: "center",
    justifyContent: "center",
  }),
  boxHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral3Hover,
  }),
  boxChecked: (theme) => ({
    borderColor: theme.colors.interactivePrimaryHover,
    backgroundColor: theme.colors.interactivePrimaryHover,
  }),
  boxDisabled: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
    backgroundColor: theme.colors.interactiveNeutral2Default,
    opacity: 0.6,
  }),
});
