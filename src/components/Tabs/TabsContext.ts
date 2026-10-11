import { createContext } from "react";
import type { StyleProp, ViewStyle } from "react-native";

interface TabsContextValue {
  disabled?: boolean;
  tabBarStyle?: StyleProp<ViewStyle>;
}

export const TabsContext = createContext({} as TabsContextValue);
