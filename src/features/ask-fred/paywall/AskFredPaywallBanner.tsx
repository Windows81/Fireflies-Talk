import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_FLOATING_SHADOW } from "@/styles/elevation";
import type { FC } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import type { AskFredPaywallOffer } from "./useAskFredPaywall";

/**
 * Compact upgrade prompt that sits between an AskFred thread and its composer.
 * It floats over the pane rather than replacing it, so the suggestions stay
 * visible as a preview of what the user is buying.
 */
export const AskFredPaywallBanner: FC<{
  paywall: AskFredPaywallOffer;
  /** Animated by the caller to nudge the banner on a blocked interaction. */
  style?: StyleProp<ViewStyle>;
}> = ({ paywall: { title, description, cta }, style }) => {
  const theme = useTheme();

  return (
    <Animated.View style={[styles.root(theme), style]}>
      <View style={styles.copy}>
        <Text variant="title3Regular" color="textSecondary">
          {title}
        </Text>
        <Text variant="body3Regular" color="textMuted" numberOfLines={1}>
          {description}
        </Text>
      </View>
      {cta && (
        <Button
          variant="text"
          size="xs"
          style={styles.cta}
          hoverStyle={styles.ctaHover(theme)}
          onPress={cta.onPress}
        >
          {cta.label}
        </Button>
      )}
    </Animated.View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    boxShadow: DESKTOP_FLOATING_SHADOW,
  }),
  copy: {
    flex: 1,
    gap: 2,
  },
  cta: {
    borderRadius: 6,
  },
  ctaHover: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
});
