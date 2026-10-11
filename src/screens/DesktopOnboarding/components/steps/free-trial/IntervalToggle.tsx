import { Text } from "@/components/Typography";
import {
  FREE_TRIAL_ANNUAL_DISCOUNT_PCT,
  type FreeTrialInterval,
} from "@/features/free-trial";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { Pressable, View } from "react-native";

interface IntervalToggleProps {
  value: FreeTrialInterval;
  onChange: (value: FreeTrialInterval) => void;
}

export const IntervalToggle: FC<IntervalToggleProps> = ({
  value,
  onChange,
}) => (
  <View style={styles.wrap}>
    <Pressable
      onPress={() => onChange("month")}
      style={[styles.tab, value === "month" && styles.tabActive]}
    >
      <Text
        variant="title3Weight"
        style={
          value === "month" ? styles.tabActiveText : styles.tabInactiveText
        }
      >
        Monthly
      </Text>
    </Pressable>
    <Pressable
      onPress={() => onChange("year")}
      style={[styles.tab, value === "year" && styles.tabActive]}
    >
      <Text
        variant="title3Weight"
        style={value === "year" ? styles.tabActiveText : styles.tabInactiveText}
      >
        Annual
      </Text>
      <View style={styles.badge}>
        <Text variant="body3Regular" style={styles.badgeText}>
          Upto {FREE_TRIAL_ANNUAL_DISCOUNT_PCT}% OFF
        </Text>
      </View>
    </Pressable>
  </View>
);

const styles = createStyles({
  wrap: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: DESKTOP_THEME.grey1000,
    padding: 4,
    borderRadius: 6,
    gap: 2,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  tabActive: {
    backgroundColor: DESKTOP_THEME.grey900,
  },
  tabInactiveText: {
    color: DESKTOP_THEME.grey550,
  },
  tabActiveText: {
    color: DESKTOP_THEME.grey500,
  },
  badge: {
    backgroundColor: "#002E1B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    color: "#23C035",
  },
});
