import { useTheme } from "@/styles";
import { RootNavigation } from "@/screens/RootNavigation";
import { useLinkProps } from "@react-navigation/native";
import type { PropsWithChildren } from "react";
import { forwardRef, useMemo, useState } from "react";
import type { Text, GestureResponderEvent } from "react-native";
import { Text as RNText } from "react-native";
import { getStyles } from "./styles";
import type { LinkViewProps } from "./types";
import { createTo } from "./utils";

export const LinkView = forwardRef<Text, PropsWithChildren<LinkViewProps>>(
  function LinkViewWeb(
    { href, style, animated, children, onPress, ...props },
    ref,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const theme = useTheme();

    const linkStyle = getStyles(theme, { animated, style, hovered: isHovered })(
      {
        pressed: isPressed,
      },
    );

    const to = useMemo(() => createTo(href), [href]);

    const linkProps = useLinkProps(to);

    const navigateOnPress = (ev: GestureResponderEvent) => {
      onPress?.(ev);
      if (!ev.defaultPrevented) {
        ev.preventDefault();
        if (typeof href === "string") {
          RootNavigation.navigate(href);
        } else {
          RootNavigation.navigate(href.pathname, href.params);
        }
      }
    };

    return (
      <RNText
        {...props}
        ref={ref}
        style={linkStyle}
        accessibilityRole="link"
        // @ts-expect-error: href only exists in web
        href={linkProps.href}
        onPress={navigateOnPress}
        onPointerEnter={() => {
          setIsHovered(true);
        }}
        onPointerLeave={() => {
          setIsHovered(false);
        }}
        onPressIn={() => {
          setIsPressed(true);
        }}
        onPressOut={() => {
          setIsPressed(false);
        }}
      >
        {children}
      </RNText>
    );
  },
);
