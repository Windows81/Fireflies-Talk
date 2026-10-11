import { CircularLoadingDot } from "@/components/Loading";
import { ShimmerText } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_FLOATING_SHADOW } from "@/styles/elevation";
import type { FC } from "react";
import { View } from "react-native";

/**
 * "Polishing your notes…" indicator. Positioned by the caller — it rides the
 * reveal boundary (SummaryReveal) as the general summary wipes into place.
 */
export const PolishingPill: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.pill(theme)}>
      <CircularLoadingDot />
      <ShimmerText variant="body3Regular">Polishing your notes…</ShimmerText>
    </View>
  );
};

const styles = createStyles({
  pill: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.layerStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    boxShadow: DESKTOP_FLOATING_SHADOW,
  }),
});
