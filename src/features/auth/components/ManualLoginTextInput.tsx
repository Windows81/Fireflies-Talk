import { TextInput } from "@/components/Input";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { ManualLoginState } from "./useManualLogin";

export const ManualLoginTextInput: FC<{
  login: ManualLoginState;
  placeholder: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ login, placeholder, autoFocus, style }) => (
  <TextInput
    placeholder={placeholder}
    value={login.value}
    onValueChange={login.setValue}
    onSubmitEditing={login.submit}
    autoFocus={autoFocus}
    style={style}
  />
);
