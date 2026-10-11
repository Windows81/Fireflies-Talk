import { Platform, type ViewStyle } from "react-native";

/**
 * Android shadow is just a joke
 */
export const ELEVATIONS = {
  1: Platform.select({
    android: {
      elevation: 1,
      shadowColor: "rgb(16, 24, 40)",
    },
    web: {
      boxShadow: "0px 2px 2px 0px rgba(16, 24, 40, 0.04)",
    },
    default: {
      shadowColor: "rgb(16, 24, 40)",
      shadowOpacity: 0.02,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowRadius: 0,
    },
  }),
  2: Platform.select({
    android: {
      elevation: 4,
      shadowColor: "rgba(16, 24, 40, 0.2)",
    },
    web: {
      boxShadow:
        "0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.08)",
    },
    default: {
      shadowColor: "rgb(16, 24, 40)",
      shadowOpacity: 0.06,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowRadius: 4,
    },
  }),
  3: Platform.select({
    android: {
      elevation: 6,
      shadowColor: "rgb(16, 24, 40)",
    },
    web: {
      boxShadow: "0px 6px 6px 0px rgba(0, 0, 0, 0.2)",
    },
    default: {
      shadowColor: "rgb(16, 24, 40)",
      shadowOpacity: 0.2,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowRadius: 0,
    },
  }),
} satisfies Record<number, ViewStyle>;

/**
 * Shadow for cards that float above desktop surfaces (hover cards, pills,
 * paywall banners). Two layers: a wide ambient halo plus a tight contact
 * shadow, both near-black so they read against the dark desktop theme.
 * Desktop-only, so the web `boxShadow` needs no platform fallback.
 */
export const DESKTOP_FLOATING_SHADOW =
  "0px 0px 16px -4px rgba(0, 0, 0, 0.6), 0px 2px 6px -4px rgba(0, 0, 0, 0.6)";
