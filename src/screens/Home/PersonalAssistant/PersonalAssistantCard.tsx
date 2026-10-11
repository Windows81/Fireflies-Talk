import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { Pressable, View } from "react-native";
import type { SvgProps } from "react-native-svg";

interface PersonalAssistantCardProps {
  Icon: FC<SvgProps>;
  title: string;
  description: string;
  backgroundColor: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
  onPress: () => void;
  /** Interactive element shown at the end of the subtitle row, right-aligned. */
  subtitleAction?: ReactNode;
}
const CARD_WIDTH = 145;
const CARD_HEIGHT = 118;

export const PersonalAssistantCard: FC<PersonalAssistantCardProps> = ({
  Icon,
  title,
  description,
  backgroundColor,
  iconColor,
  badge,
  badgeColor,
  disabled,
  onPress,
  subtitleAction,
}) => {
  const theme = useTheme();
  const cardBackground = disabled ? theme.colors.layerStrong : backgroundColor;
  const resolvedIconColor = disabled
    ? theme.colors.commandNeutralDisabled
    : iconColor;
  const titleColor = disabled ? "textMuted" : "textSecondary";

  return (
    <Pressable
      style={[styles.card, { backgroundColor: cardBackground }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon width={20} height={20} color={resolvedIconColor} />
        </View>
        {badge && !disabled && (
          <View style={styles.badge(theme)}>
            <Text
              variant="body3Regular"
              style={{ color: badgeColor ?? iconColor }}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.titleRow}>
          <Text
            variant="title2Weight"
            color={titleColor}
            numberOfLines={1}
            style={styles.title}
          >
            {title}
          </Text>
          {disabled && (
            <Text variant="title3Regular" color="textMuted">
              {" "}
              (OFF)
            </Text>
          )}
        </View>
        <View style={styles.subtitleRow}>
          <Text
            variant="title3Regular"
            color="textMuted"
            numberOfLines={1}
            style={styles.subtitle}
          >
            {disabled ? "Not enabled" : description}
          </Text>
          {!disabled && subtitleAction}
        </View>
      </View>
    </Pressable>
  );
};

const styles = createStyles({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    padding: 18,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: (theme) => ({
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.rainbowStaticCyanSubtle
        : "rgba(255, 255, 255, 0.6)",
  }),
  footer: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    overflow: "hidden",
  },
  title: {
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  subtitle: {
    flexShrink: 1,
  },
});
