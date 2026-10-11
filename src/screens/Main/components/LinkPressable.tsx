import { RNText } from "@/components/Typography";
import { RootNavigation } from "@/screens/RootNavigation";
import { useLinkProps } from "@react-navigation/native";
import type { FC, ReactNode } from "react";
import type {
  AccessibilityProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Platform, Pressable } from "react-native";

/**
 * Render a Pressable on mobile and a link on web (enabling right click open link in new tab)
 */
export const LinkPressable: FC<
  {
    children: ReactNode;
    onPress?: (ev: GestureResponderEvent) => void;
    onLongPress?: (ev: GestureResponderEvent) => void;
    style?: StyleProp<ViewStyle>;
    href: string;
  } & AccessibilityProps
> = ({ children, onPress, href, ...props }) => {
  const linkProps = useLinkProps({
    screen: href,
  });

  const navigateOnPress = (ev: GestureResponderEvent) => {
    if (href) {
      ev.preventDefault();
      RootNavigation.navigate(href);
    }
  };

  if (Platform.OS === "web") {
    return (
      <RNText
        {...props}
        accessibilityRole={"link"}
        // @ts-expect-error: href only in web
        href={linkProps.href}
        onPress={onPress || navigateOnPress}
        aria-selected={undefined}
      >
        {children}
      </RNText>
    );
  }
  return (
    <Pressable onPress={onPress || navigateOnPress} {...props}>
      {children}
    </Pressable>
  );
};
