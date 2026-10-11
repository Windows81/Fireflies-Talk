import { IconHome } from "@/assets/svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { FC } from "react";
import type { GestureResponderEvent } from "react-native";
import type { SvgProps } from "react-native-svg";
import { RouteIconMap } from "./constants";

export interface TabButtonProps {
  name: string;
  title: string;
  focused?: boolean;
  Icon: FC<SvgProps>;
  onPress?: (ev: GestureResponderEvent) => void;
  onLongPress?: (ev: GestureResponderEvent) => void;
}

export const getTabButtonProps = (
  state: BottomTabBarProps["state"],
  navigation: BottomTabBarProps["navigation"],
  descriptors: BottomTabBarProps["descriptors"],
  route: BottomTabBarProps["state"]["routes"][number],
  index: number,
): TabButtonProps => {
  const { options } = descriptors[route.key];
  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;

  const isFocused = state.index === index;

  const onPress = (ev: GestureResponderEvent) => {
    ev.preventDefault();

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };

  const Icon = RouteIconMap[route.name] || IconHome;

  return {
    title: label as string,
    focused: isFocused,
    name: route.name,
    Icon,
    onPress,
    onLongPress,
  };
};
