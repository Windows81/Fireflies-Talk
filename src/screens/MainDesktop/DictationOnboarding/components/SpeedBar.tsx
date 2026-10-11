import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { View, type DimensionValue } from "react-native";

interface SpeedBarProps {
  wordsPerMinute: number;
  caption: string;
  width: DimensionValue;
  highlighted?: boolean;
}

export const SpeedBar: FC<SpeedBarProps> = ({
  wordsPerMinute,
  caption,
  width,
  highlighted = false,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.measure}>
      <View
        style={[
          styles.bar(theme),
          {
            width,
            backgroundColor: highlighted
              ? DESKTOP_THEME.green675
              : DESKTOP_THEME.slate800,
          },
        ]}
      >
        <Text variant="heading4" color="textPrimary">
          {wordsPerMinute}
        </Text>
        <Text variant="body2Regular" color="textPrimary">
          words/min
        </Text>
      </View>
      <Text
        variant="title3Regular"
        color="textMuted"
        style={styles.caption}
        numberOfLines={1}
      >
        {caption}
      </Text>
    </View>
  );
};

const styles = createStyles({
  measure: {
    alignSelf: "stretch" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  // Slightly less bottom padding than top, so the numbers sit optically
  // centred against their taller line box.
  bar: (theme) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.06),
    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.13), 0px 2px 5px rgba(0, 0, 0, 0.13), 0px 1px 1px rgba(0, 0, 0, 0.13)",
  }),
  caption: {
    paddingLeft: 14,
  },
});
