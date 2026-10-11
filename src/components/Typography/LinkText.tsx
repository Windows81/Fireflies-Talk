import type { FC, PropsWithChildren } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Platform, StyleSheet } from "react-native";
import * as NativeCode from "@/modules/native-code";
import { Text } from "./Text";
import type { TextProps } from "./types";

interface LinkTextProps {
  href: string;
  style?: StyleProp<TextStyle>;
}

export const LinkText: FC<PropsWithChildren<TextProps & LinkTextProps>> = ({
  children,
  href,
  ...props
}) => {
  return (
    <Text
      {...props}
      style={[styles.base, props.style]}
      {...(Platform.OS === "web"
        ? {
            href,
            target: "_blank",
            tabIndex: -1,
          }
        : {
            onPress: () => NativeCode.openInBrowser(href),
          })}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    textDecorationLine: "underline",
    outlineWidth: 0,
    backgroundColor: "transparent",
  },
});
