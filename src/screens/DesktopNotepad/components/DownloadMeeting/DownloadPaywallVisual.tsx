import { imagePaywallLayer } from "@/assets/images";
import { Text } from "@/components/Typography";
import {
  FREE_TRIAL_ANNUAL_DISCOUNT_PCT,
  FREE_TRIAL_ANNUAL_PER_MONTH_USD,
  FREE_TRIAL_MONTHLY_PRICE_USD,
} from "@/features/free-trial";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { formatUsd } from "@/utils/price";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { Image, StyleSheet, View } from "react-native";

/**
 * Right half of the download paywall: night-sky artwork with the Business plan
 * price pinned to its bottom-left. The artwork ships at the panel's exact size,
 * so it only needs the scrim that keeps the price legible over the photo.
 */
export const DownloadPaywallVisual: FC = () => (
  <View style={styles.root}>
    <Image
      source={imagePaywallLayer}
      style={styles.artwork}
      resizeMode="cover"
    />
    {/* Darkens the lower half so the plan block reads over the photo while the
        sky stays vivid. These rgba stops composite the artwork itself — they
        are a scrim over photography, not a themed surface. */}
    <LinearGradient
      colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.35)", "rgba(0, 0, 0, 0.9)"]}
      locations={[0, 0.45, 1]}
      style={styles.scrim}
    />
    <View style={styles.plan}>
      <View style={styles.planName}>
        <Text variant="title2Weight">Business Plan</Text>
        <View style={styles.discount}>
          <Text variant="body3Regular" style={styles.discountText}>
            {FREE_TRIAL_ANNUAL_DISCOUNT_PCT}% OFF
          </Text>
        </View>
      </View>
      <View style={styles.price}>
        <Text
          variant="body2Regular"
          color="textSecondary"
          style={styles.listPrice}
        >
          {formatUsd(FREE_TRIAL_MONTHLY_PRICE_USD)}
        </Text>
        <Text variant="body2Regular" color="textMuted">
          {formatUsd(FREE_TRIAL_ANNUAL_PER_MONTH_USD)} per seat
        </Text>
      </View>
    </View>
  </View>
);

const styles = createStyles({
  root: {
    width: 320,
    alignSelf: "stretch",
  },
  // Explicit 100%: an absolutely positioned image with only inset offsets falls
  // back to its intrinsic size on web, which crops instead of covering.
  artwork: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: StyleSheet.absoluteFillObject,
  plan: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 24,
    gap: 8,
  },
  planName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discount: {
    backgroundColor: DESKTOP_THEME.green50Discount,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: DESKTOP_THEME.green500Discount,
  },
  price: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listPrice: {
    textDecorationLine: "line-through",
  },
});
