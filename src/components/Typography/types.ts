import type { FontStyles, Fonts, Theme } from "@/styles";
import type {
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from "react-native";

export interface TextProps extends RNTextProps {
  color?: keyof Theme["colors"];
  fontFamily?: keyof typeof Fonts;
  fontWeight?: "400" | "500" | "700";
  fontStyle?: "regular" | "italic";
  textAlign?: TextStyle["textAlign"];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  fontSize?: number;
  variant?: keyof typeof FontStyles;
  lineHeightMultiplier?: number;
}
