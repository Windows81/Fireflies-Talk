import { IconCommand, IconWindows } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import type { ShortcutKeycap } from "electron/src/dictation/shortcut-keys";
import { type FC } from "react";
import { StyleSheet, View } from "react-native";

const keycapIcons = {
  command: IconCommand,
  windows: IconWindows,
};

const getKeycapStyle = (theme: ReturnType<typeof useTheme>) => ({
  alignItems: "center" as const,
  backgroundColor: theme.colors.interactiveSecondaryHover,
  borderColor: theme.colors.borderStaticSubtle,
  borderRadius: 6,
  borderWidth: 1,
  flexDirection: "row" as const,
  gap: 4,
  justifyContent: "center" as const,
  minWidth: 28,
  paddingHorizontal: 8,
  paddingVertical: 3,
});

export const ShortcutKeycaps: FC<{ keycaps: ShortcutKeycap[] }> = ({
  keycaps,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.keycaps}>
      {keycaps.map((keycap, index) => {
        const Icon = keycap.icon ? keycapIcons[keycap.icon] : null;
        // Icon-only keycaps (Windows) have no visible text, so the icon carries the name
        const iconOnly = keycap.icon === "windows";
        return (
          <View key={`${keycap.label}-${index}`} style={styles.keycapGroup}>
            {index > 0 ? (
              <Text
                variant="body2Regular"
                color="textMuted"
                style={styles.plus}
              >
                +
              </Text>
            ) : null}
            <View style={getKeycapStyle(theme)}>
              {Icon ? (
                <View
                  accessibilityRole={iconOnly ? "image" : undefined}
                  accessibilityLabel={iconOnly ? keycap.label : undefined}
                  style={styles.icon}
                >
                  <Icon
                    width={14}
                    height={14}
                    color={theme.colors.textPrimary}
                  />
                </View>
              ) : keycap.glyph ? (
                <Text variant="body2Weight">{keycap.glyph}</Text>
              ) : null}
              {iconOnly ? null : (
                <Text variant="body2Weight">{keycap.label}</Text>
              )}
              {keycap.side === "right" ? (
                <Text variant="body3Regular" color="textMuted">
                  R
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Matches the body2 line height so icon-only chips are as tall as text chips
  icon: {
    height: 20,
    justifyContent: "center" as const,
  },
  keycapGroup: {
    alignItems: "center" as const,
    flexDirection: "row" as const,
  },
  keycaps: {
    alignItems: "center" as const,
    flexDirection: "row" as const,
  },
  plus: {
    marginHorizontal: 4,
  },
});
