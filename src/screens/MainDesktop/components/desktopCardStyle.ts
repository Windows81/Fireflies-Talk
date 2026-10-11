import { vars } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { ViewStyle } from "react-native";

/**
 * Card chrome shared by the home cards on the desktop screen (Notetaker tiles,
 * dictation stats), so every card on the page reads with the same radius and
 * surface.
 */
export const DESKTOP_CARD_STYLE: ViewStyle = {
  backgroundColor: withAlpha(DESKTOP_THEME.grey100, 0.05),
  borderWidth: 1,
  borderColor: DESKTOP_THEME.grey950,
  borderRadius: 12,
};

/** Glass fill and border for outlined CTAs on desktop banners. */
export const DESKTOP_GLASS_BUTTON_STYLE: ViewStyle = {
  ...vars.elevations[1],
  backgroundColor: withAlpha(DESKTOP_THEME.grey100, 0.12),
  borderWidth: 1,
  borderColor: withAlpha(DESKTOP_THEME.grey100, 0.06),
  borderRadius: 6,
};

export const DESKTOP_GLASS_BUTTON_HOVER_STYLE: ViewStyle = {
  backgroundColor: withAlpha(DESKTOP_THEME.grey100, 0.18),
};
