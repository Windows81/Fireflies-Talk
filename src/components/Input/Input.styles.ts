import { createStyles, vars } from "@/styles";
import { isDesktop } from "@/utils/device";
import type { TextStyle, ViewStyle } from "react-native";
import { Platform } from "react-native";

export const PADDING_VERTICAL = 10 - 2;

export const getNumberOfLinesStyle = (
  numberOfLines: number | undefined,
): TextStyle | undefined => {
  if (!numberOfLines || numberOfLines <= 1) {
    return undefined;
  }
  return {
    maxHeight: numberOfLines * 20 + PADDING_VERTICAL * 2,
  };
};

export const styles = createStyles({
  root: {
    borderRadius: isDesktop ? 8 : 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  input: (theme) => ({
    color: theme.colors.textSecondary,
    flex: 1,
    ...(Platform.OS === "web" && {
      outline: "none",
    }),
    maxHeight: 20 + PADDING_VERTICAL * 2,
    paddingVertical: PADDING_VERTICAL,
    paddingHorizontal: 8,
    ...vars.typography.body2Regular,
  }),
  leading: {
    paddingLeft: 4,
  },
  trailing: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  outlined: (theme) => ({
    backgroundColor: isDesktop
      ? theme.colors.interactiveSecondaryDisabled
      : theme.colors.interactiveNeutral1Default,
    borderColor: theme.colors.borderStaticDefault,
  }),
  outlinedHover: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
  }),
  outlinedFocused: (theme) => ({
    borderColor: theme.colors.borderStaticBrand,
  }),
  // Rounded, grey-filled search field. Border stays a subtle grey in every
  // state (no brand/purple focus ring) per the Notebook search design.
  search: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
    borderColor: theme.colors.borderInteractiveHover,
    borderRadius: 9999,
    paddingHorizontal: 8,
  }),
  searchHover: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
  }),
  searchFocused: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
  }),
  // Center the text inside the rounded pill: Android adds extra font padding
  // that pushes the text off-center, and the baseline reads ~2px low, so nudge
  // it up with asymmetric padding (keeps the 36px field height).
  searchInput: () => ({
    textAlignVertical: "center",
    includeFontPadding: false,
    paddingTop: PADDING_VERTICAL - 2,
    paddingBottom: PADDING_VERTICAL + 2,
  }),
  filled: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
    borderColor: "transparent",
  }),
  filledHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  filledFocused: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
    borderColor: theme.colors.borderInteractiveActive,
  }),
  inlined: (theme) => ({
    backgroundColor: "transparent",
    borderColor: theme.colors.borderStaticTransparent,
  }),
  inlinedHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
  inlinedFocused: (theme) => ({
    borderColor: theme.colors.borderInteractiveActive,
  }),
  underlined: () => ({
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    paddingHorizontal: 0,
    paddingLeft: 0,
    cursor: "pointer",
  }),
  underlinedHover: () => ({
    borderBottomColor: "white",
  }),
  underlinedFocused: () => ({
    borderBottomColor: "white",
    cursor: "auto",
  }),
  underlinedSizer: () => ({
    paddingHorizontal: 0,
    paddingVertical: 0,
    opacity: 0,
  }),
  underlinedInput: () =>
    ({
      paddingHorizontal: 0,
      paddingVertical: 0,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      cursor: "inherit",
    }) as unknown as ViewStyle,
  disabled: (theme) => ({
    borderColor: theme.colors.borderInteractiveDisabled,
  }),
  inputDisabled: (theme) => ({
    color: theme.colors.textDisabled,
  }),
  clear: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // size
  sm: {
    minHeight: 36,
    paddingHorizontal: 4,
  },
  md: {
    minHeight: 40,
    paddingHorizontal: 4,
  },
});
