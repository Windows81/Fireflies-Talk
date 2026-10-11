import { useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { format } from "date-fns";
import type { FC } from "react";
import type { AccessibilityProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, Text } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { styles } from "./Input.styles";
import type { InputProps } from "./TextInput";

interface DateInputProps {
  value: Date;
  onChangeValue: (value: Date) => void;
  style?: StyleProp<ViewStyle>;
  variant?: InputProps["variant"];
  size?: InputProps["size"];
  disabled?: boolean;
  min?: Date;
  max?: Date;
}

export const DateInput: FC<DateInputProps & AccessibilityProps> = ({
  value,
  onChangeValue,
  style,
  variant = "outlined",
  size = "md",
  disabled,
  min,
  max,
  ...props
}) => {
  const theme = useTheme();

  const [focused, setFocusedTrue, setFocusedFalse] = useBooleanState();

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.root,
          styles[variant](theme),
          styles[size],
          pressed && styles[`${variant}Hover`](theme),
          focused && styles[`${variant}Focused`](theme),
          style,
        ]}
        disabled={disabled}
        onPress={setFocusedTrue}
        {...props}
      >
        <Text
          style={[styles.input(theme), disabled && styles.inputDisabled(theme)]}
        >
          {format(value, "dd MMM, yyyy")}
        </Text>
      </Pressable>
      <DateTimePickerModal
        isVisible={focused}
        date={value}
        minimumDate={min}
        maximumDate={max}
        mode="date"
        onCancel={setFocusedFalse}
        onConfirm={(date) => {
          onChangeValue(date);
          setFocusedFalse();
        }}
        themeVariant={theme.name === "dark" ? "dark" : "light"}
        display="inline"
      />
    </>
  );
};
