import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { pluralize } from "@/utils/pluralize";
import { View } from "react-native";
import { useBilling } from "../useBilling";

/**
 * How many meetings the team can still have summarised. Paid plans report no
 * limit, so nothing renders.
 */
export const FreeMeetingsCounter = () => {
  const { isFreeUser, freeMeetingsLeft } = useBilling();

  if (!isFreeUser || typeof freeMeetingsLeft !== "number") return null;

  return (
    <HoverTooltip label="Meetings with summary notes" position="bottom">
      <View style={styles.root}>
        <View
          style={[
            styles.badge,
            freeMeetingsLeft > 0
              ? styles.badgeAvailable
              : styles.badgeExhausted,
          ]}
        >
          <Text variant="body3Regular" color="commandContrastDefault">
            {freeMeetingsLeft}
          </Text>
        </View>
        <Text variant="body3Regular" style={styles.label}>
          Free {pluralize("meeting", freeMeetingsLeft)}
        </Text>
      </View>
    </HoverTooltip>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // `minWidth` keeps the square shape of a single digit while letting a team's
  // pooled count run to two.
  badge: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeAvailable: {
    backgroundColor: DESKTOP_THEME.freeMeetingsBadge,
  },
  badgeExhausted: {
    backgroundColor: DESKTOP_THEME.freeMeetingsBadgeExhausted,
  },
  label: {
    color: DESKTOP_THEME.grey550,
  },
});
