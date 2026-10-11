import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";

interface FnBadgeProps {
  /** Shortcut label, " + " separated — each key gets its own cap. */
  label: string;
  active?: boolean;
}

export const FnBadge: FC<FnBadgeProps> = ({ label, active = false }) => (
  <View style={styles.chain}>
    {label.split(" + ").map((key, index) => (
      <View
        key={`${key}-${index}`}
        style={[
          styles.badge,
          {
            backgroundColor: active
              ? DESKTOP_THEME.green700
              : DESKTOP_THEME.grey910,
            borderColor: active
              ? DESKTOP_THEME.green750
              : DESKTOP_THEME.grey790,
          },
        ]}
      >
        <Text
          variant="body2Weight"
          style={
            {
              color: active ? DESKTOP_THEME.grey100 : DESKTOP_THEME.grey400,
            } as never
          }
        >
          {key}
        </Text>
      </View>
    ))}
  </View>
);

const styles = createStyles({
  chain: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  badge: {
    minWidth: 32,
    paddingHorizontal: 6,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.13), 0px 2px 5px rgba(0, 0, 0, 0.13), 0px 1px 1px rgba(0, 0, 0, 0.13)",
  },
});
