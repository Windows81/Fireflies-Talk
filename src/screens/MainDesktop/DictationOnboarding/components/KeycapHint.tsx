import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { FnBadge } from "./FnBadge";

interface KeycapHintProps {
  before: string;
  label: string;
  orLabel?: string;
  after?: string;
  /** Lit while the user is physically pressing the shortcut. */
  active: boolean;
  color?: "textPrimary" | "textMuted";
}

/** One sentence with the shortcut keycap inline, wrapping like prose. */
export const KeycapHint: FC<KeycapHintProps> = ({
  before,
  label,
  orLabel,
  after,
  active,
  color = "textMuted",
}) => (
  <View style={styles.row}>
    <Text variant="body2Regular" color={color} style={styles.text}>
      {before}
    </Text>
    <FnBadge label={label} active={active} />
    {orLabel ? (
      <>
        <Text variant="body2Regular" color={color} style={styles.text}>
          or press
        </Text>
        <FnBadge label={orLabel} active={active} />
      </>
    ) : null}
    {after ? (
      <Text variant="body2Regular" color={color} style={styles.text}>
        {after}
      </Text>
    ) : null}
  </View>
);

const styles = createStyles({
  row: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    rowGap: 4,
    columnGap: 6,
  },
  text: {
    flexShrink: 1,
  },
});
