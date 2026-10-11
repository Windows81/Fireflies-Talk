import { GLOBAL as GLOBAL_COLORS } from "./color";
import { ELEVATIONS } from "./elevation";
import { FontStyles } from "./typography";
export { Breakpoint } from "./breakpoint";
export type { RainbowColor } from "./color";
export {
  ThemeContext,
  ThemeProvider,
  createStyles,
  darkTheme,
  darkVibrantTheme,
  desktopUiTheme,
  lightTheme,
  useTheme,
} from "./theme";
export type { Theme } from "./theme";
export { FontStyles, Fonts } from "./typography";
export const vars = {
  elevations: ELEVATIONS,
  colors: GLOBAL_COLORS,
  typography: FontStyles,
};
