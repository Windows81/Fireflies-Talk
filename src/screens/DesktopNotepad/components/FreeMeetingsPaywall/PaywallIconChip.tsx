import { createStyles, useTheme, vars } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

/**
 * Bordered glyph chip that heads the free-meetings paywalls, so both surfaces
 * read as the same offer.
 */
export const PaywallIconChip: FC<{
  Icon: FC<SvgProps>;
  /** Set for outline glyphs the design draws solid, such as the zap. */
  solid?: boolean;
}> = ({ Icon, solid }) => {
  const theme = useTheme();
  const color = DESKTOP_THEME.teal700Paywall;

  return (
    <View style={styles.root(theme)}>
      <Icon
        width={20}
        height={20}
        color={color}
        // A filled glyph loses weight at 20px, so thicken its stroke to match.
        {...(solid && { fill: color, strokeWidth: 2 })}
      />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    backgroundColor: theme.colors.layerAlphaDefault,
    ...vars.elevations[1],
  }),
});
