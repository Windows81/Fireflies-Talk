import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { Checkbox } from "../Checkbox";
import { Text } from "../Typography";
import type { SelectOption } from "./Select";
import { ITEM_HEIGHT } from "./selectConstants";

export const SelectItem: FC<{
  option: SelectOption<any>;
  selected: boolean;
  highlighted?: boolean;
  nativeID?: string;
  onPress: () => void;
  showCheckbox?: boolean;
  /** Resting background, for lists that sit on a surface other than the page. */
  surfaceColor?: string;
}> = ({
  option,
  selected,
  highlighted,
  nativeID,
  onPress,
  showCheckbox,
  surfaceColor,
}) => {
  const theme = useTheme();
  const disabled = option.disabled === true;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      role="option"
      nativeID={nativeID}
      aria-selected={selected}
      aria-disabled={disabled}
      accessibilityState={{
        disabled,
        selected,
      }}
      style={({
        pressed,
        hovered,
      }: {
        pressed: boolean;
        hovered?: boolean;
      }) => ({
        backgroundColor: highlighted
          ? theme.colors.interactiveNeutral2Hover
          : pressed
            ? theme.colors.layerMuted
            : hovered
              ? theme.colors.interactiveNeutral1Hover
              : selected
                ? theme.colors.interactiveNeutral1Hover
                : (surfaceColor ?? theme.colors.layerDefault),
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <View style={styles.option}>
        {showCheckbox ? (
          <Checkbox
            value={selected}
            pointerEvents="none"
            size={16}
            accessible={false}
          />
        ) : null}
        {option.Icon && (
          <option.Icon
            width={16}
            height={16}
            color={theme.colors.textSecondary}
          />
        )}
        {option.left}
        <Text
          variant="body2Regular"
          color="textSecondary"
          style={styles.optionLabel}
        >
          {option.label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = createStyles({
  option: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    minHeight: ITEM_HEIGHT,
    paddingVertical: 8,
  },
  optionLabel: {
    flex: 1,
  },
});
