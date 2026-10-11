import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type FC } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Text } from "@/components/Typography";
import { DESKTOP_CARD_STYLE } from "./desktopCardStyle";

export const DISABLED_GRADIENT: [string, string] = [
  DESKTOP_THEME.grey800,
  DESKTOP_THEME.grey800,
];

export interface TileProps {
  Icon: FC<SvgProps>;
  title: string;
  description: string;
  enableDescription?: string;
  gradientColors: [string, string];
  badge?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

export const Tile: FC<TileProps> = ({
  Icon,
  title,
  description,
  enableDescription,
  gradientColors,
  badge,
  disabled,
  loading,
  onPress,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const webHoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  // A disabled tile previews its enabled appearance on hover (full-color icon,
  // bright title, "Enable" affordance); otherwise it shows the muted state.
  // `loading` keeps the enabled look while the enable mutation is in flight so
  // the icon doesn't flicker back to grey if the mouse leaves mid-toggle.
  const showEnabledAppearance = !disabled || isHovered || loading;

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...webHoverProps}
    >
      <View style={styles.tileTop}>
        <LinearGradient
          colors={showEnabledAppearance ? gradientColors : DISABLED_GRADIENT}
          style={styles.iconContainer}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon width={20} height={20} color="#FFFFFF" />
          )}
        </LinearGradient>
        {badge && !disabled && (
          <View style={styles.badge}>
            <Text variant="body3Regular" style={styles.badgeText}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.tileContent}>
        <Text
          variant="body2Weight"
          style={
            showEnabledAppearance ? styles.tileTitle : styles.tileTitleDisabled
          }
          numberOfLines={1}
        >
          {title}
        </Text>
        {disabled && showEnabledAppearance && enableDescription ? (
          <View style={styles.enableRow}>
            <Text variant="body2Regular" style={styles.enableLink}>
              Enable
            </Text>
            <Text
              variant="body2Regular"
              style={styles.tileDescription}
              numberOfLines={1}
            >
              {enableDescription}
            </Text>
          </View>
        ) : (
          <Text
            variant="body2Regular"
            style={styles.tileDescription}
            numberOfLines={1}
          >
            {disabled ? "Not enabled" : description}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = createStyles({
  tile: {
    ...DESKTOP_CARD_STYLE,
    flex: 1,
    padding: 16,
    gap: 16,
  },
  tilePressed: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  tileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  badgeText: {
    color: DESKTOP_THEME.grey500,
  },
  tileContent: {
    gap: 2,
  },
  enableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  enableLink: {
    color: DESKTOP_THEME.grey500,
    textDecorationLine: "underline",
  },
  tileTitle: {
    color: DESKTOP_THEME.grey500,
  },
  tileTitleDisabled: {
    color: DESKTOP_THEME.grey700,
  },
  tileDescription: {
    color: DESKTOP_THEME.grey700,
  },
});
