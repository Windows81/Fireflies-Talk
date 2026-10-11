import type { ImageStyle } from "expo-image";
import type { FC, PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Appearance,
  Dimensions,
  Platform,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
  useColorScheme,
} from "react-native";
import { Breakpoint, responsiveSizes } from "./breakpoint";
import * as Colors from "./color";
import { isDesktop } from "@/utils/device";
import { useAppearanceStore } from "@/features/appearance";

export const lightTheme = {
  name: "light",
  colors: Colors.LIGHT,
  breakpoint: Breakpoint.Small,
} as const;

export const darkTheme = {
  name: "dark",
  colors: Colors.DARK,
  breakpoint: Breakpoint.Small,
};

export const darkVibrantTheme = {
  name: "dark-vibrant",
  colors: Colors.DARK_VIBRANT,
  breakpoint: Breakpoint.Small,
} as const;

export const desktopUiTheme = {
  name: "desktop-ui",
  colors: Colors.DESKTOP_UI_COLORS,
  breakpoint: Breakpoint.Small,
} as const;

export const ThemeContext = createContext({} as Theme);

export const useTheme = () => useContext(ThemeContext);

/**
 * Same as StyleSheet.create, but with support for themed functions.
 * If a style is a function, it will be called with the theme and cached.
 */
export function createStyles<
  T extends ThemableNamedStyles<T> | ThemableNamedStyles<any>,
>(styles: T | ThemableNamedStyles<T>) {
  const staticStylesObj = {} as Record<keyof T, Style>;
  const dynamicStylesObj = {} as Record<keyof T, (theme: Theme) => Style>;

  for (const key of Object.keys(styles)) {
    const s = styles[key as keyof T];
    if (typeof s === "function") {
      const cache = new Map<Theme, Style>();
      dynamicStylesObj[key as keyof T] = (theme: Theme) => {
        let cached = cache.get(theme);
        if (!cached) {
          cached = s(theme);
          cache.set(theme, cached);
        }
        return cached;
      };
    } else {
      staticStylesObj[key as keyof T] = s as Style;
    }
  }

  const staticStyles = StyleSheet.create(staticStylesObj);
  return { ...staticStyles, ...dynamicStylesObj } as T;
}

type Style = ViewStyle | TextStyle | ImageStyle;

type ThemableNamedStyles<T> = {
  [P in keyof T]: Style | ((theme: Theme) => Style);
};

export type Theme =
  | typeof lightTheme
  | typeof darkTheme
  | typeof darkVibrantTheme
  | typeof desktopUiTheme;

const getBreakpoint = (width: number) => {
  if (width >= responsiveSizes.large) {
    return Breakpoint.Large;
  }
  if (width >= responsiveSizes.medium) {
    return Breakpoint.Medium;
  }
  return Breakpoint.Small;
};

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [breakpoint, setBreakpoint] = useState(() =>
    getBreakpoint(Dimensions.get("window").width),
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const newBreakpoint = getBreakpoint(window.width);
      if (newBreakpoint !== breakpoint) {
        setBreakpoint(newBreakpoint);
      }
    });
    return () => subscription.remove();
  }, [breakpoint]);

  const systemScheme = useColorScheme();
  const appearancePreference = useAppearanceStore((s) => s.preference);
  const isDarkScheme =
    appearancePreference === "system"
      ? systemScheme === "dark"
      : appearancePreference === "dark";

  // Keeps native UI (keyboard, alerts, pickers) in sync with the app override.
  useEffect(() => {
    if (Platform.OS === "web") return;
    Appearance.setColorScheme(
      appearancePreference === "system" ? "unspecified" : appearancePreference,
    );
  }, [appearancePreference]);

  const theme = useMemo(
    () => ({
      ...(isDesktop ? darkVibrantTheme : isDarkScheme ? darkTheme : lightTheme),
      breakpoint,
    }),
    [breakpoint, isDarkScheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
