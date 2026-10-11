import { FontStyles, Fonts, useTheme } from "@/styles";
import type { PropsWithChildren } from "react";
import { forwardRef } from "react";
import { Text as RNText } from "react-native";
import type { TextProps } from "./types";

export const Text = forwardRef<RNText, PropsWithChildren<TextProps>>(
  function Text(
    {
      color = "textPrimary",
      fontFamily = "dmSans",
      fontStyle = "regular",
      fontWeight = "400",
      textAlign,
      fontSize,
      variant,
      style,
      children,
      lineHeightMultiplier,
      ...props
    },
    ref,
  ) {
    const theme = useTheme();
    return (
      <RNText
        style={[
          variant && FontStyles[variant],
          {
            color: theme.colors[color],
            textAlign,
            ...(!variant && {
              fontFamily: Fonts[fontFamily][fontWeight][fontStyle],
            }),
          },
          !!fontSize && {
            fontSize,
            lineHeight: fontSize * (lineHeightMultiplier || 1.28),
          },
          style,
        ]}
        textBreakStrategy="simple"
        maxFontSizeMultiplier={1.5}
        {...props}
        ref={ref}
      >
        {children}
      </RNText>
    );
  },
);

export { RNText };
