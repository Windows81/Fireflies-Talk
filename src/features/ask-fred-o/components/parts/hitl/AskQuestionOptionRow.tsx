import { Checkbox } from "@/components/Checkbox";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";

interface AskQuestionOptionRowProps {
  optionId: string;
  label: string;
  checked: boolean;
  allowMultiple: boolean;
  disabled?: boolean;
  onToggle: (optionId: string) => void;
}

export const AskQuestionOptionRow: FC<AskQuestionOptionRowProps> = ({
  optionId,
  label,
  checked,
  allowMultiple,
  disabled,
  onToggle,
}) => {
  const theme = useTheme();
  const toggle = () => onToggle(optionId);

  if (allowMultiple) {
    return (
      <Checkbox
        label={label}
        value={checked}
        disabled={disabled}
        onValueChange={toggle}
      />
    );
  }

  return (
    <Pressable
      style={styles.root}
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={[styles.radio(theme), checked && styles.radioChecked(theme)]}
      >
        {checked && <View style={styles.dot(theme)} />}
      </View>
      <Text
        color={disabled ? "textDisabled" : "textSecondary"}
        variant="body2Regular"
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  radio: (theme) => ({
    width: 20,
    height: 20,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    alignItems: "center",
    justifyContent: "center",
  }),
  radioChecked: (theme) => ({
    borderColor: theme.colors.textBrand,
  }),
  dot: (theme) => ({
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: theme.colors.textBrand,
  }),
});
