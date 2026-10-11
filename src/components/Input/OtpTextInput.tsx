import { createStyles, useTheme } from "@/styles";
import { useRef, type FC } from "react";
import {
  View,
  TextInput,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from "react-native";

interface OtpInputProps {
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  inputStyle?: StyleProp<TextStyle>;
  value?: string;
  digitCount: number;
  onChangeText: (value: string) => void;
}

export const OtpTextInput: FC<OtpInputProps> = ({
  style,
  inputStyle,
  value = "",
  digitCount,
  onChangeText,
  disabled,
}) => {
  const inputs = useRef<TextInput[]>([]);
  const theme = useTheme();

  const codeArray = Array.from(
    { length: digitCount },
    (_, i) => value[i] || "",
  );

  const focusNextInput = (index: number) => {
    if (index < inputs.current.length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const focusPreviousInput = (index: number) => {
    if (index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleChangeText = (text: string, index: number) => {
    const newValueArray = [...codeArray];
    newValueArray[index] = text;
    const newValue = newValueArray.join("");
    onChangeText(newValue);

    if (text && index < digitCount - 1) {
      focusNextInput(index);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (value[index]) {
        const newValueArray = [...codeArray];
        newValueArray[index] = "";
        const newValue = newValueArray.join("");
        onChangeText(newValue);
      } else if (index > 0) {
        focusPreviousInput(index);
        const newValueArray = [...codeArray];
        newValueArray[index - 1] = "";
        const newValue = newValueArray.join("");
        onChangeText(newValue);
      }
    }
  };

  const setInputRef = (ref: TextInput | null, index: number) => {
    if (ref) {
      inputs.current[index] = ref;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {codeArray.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => setInputRef(ref, index)}
          value={digit}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
          keyboardType="number-pad"
          maxLength={1}
          style={[styles.input(theme), inputStyle]}
          editable={!disabled}
        />
      ))}
    </View>
  );
};

const styles = createStyles({
  container: { justifyContent: "center", flexDirection: "row" },
  input: (theme) => ({
    borderBottomWidth: 2,
    borderColor: theme.colors.interactivePrimaryDefault,
    paddingBottom: 5,
    color: theme.colors.interactivePrimaryDefault,
    margin: 5,
    fontSize: 24,
    textAlign: "center",
    width: 40,
  }),
});
