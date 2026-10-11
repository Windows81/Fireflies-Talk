import { useHeaderHeight } from "@react-navigation/elements";
import type { ComponentProps, FC, PropsWithChildren } from "react";
import {
  Platform,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
} from "react-native";

export const KeyboardAvoidingView: FC<
  PropsWithChildren<ComponentProps<typeof RNKeyboardAvoidingView>>
> = ({ children, ...props }) => {
  const headerHeight = useHeaderHeight();

  return (
    <RNKeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
      {...props}
    >
      {children}
    </RNKeyboardAvoidingView>
  );
};
