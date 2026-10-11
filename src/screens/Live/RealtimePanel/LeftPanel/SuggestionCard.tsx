import { IconChevronDown } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";

interface SuggestionCardProps {
  emoji: string;
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  isDisabled?: boolean;
}

export const SuggestionCard: FC<SuggestionCardProps> = ({
  emoji,
  title,
  description,
  isExpanded,
  onToggle,
  isDisabled,
}) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();
  const hasDescription = description.trim() !== "";

  return (
    <Pressable
      {...webHoverProps}
      onPress={onToggle}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[styles.card(theme), isHovered && styles.cardHovered(theme)]}
    >
      <Text variant="body1Regular" style={styles.emoji}>
        {emoji}
      </Text>
      <View style={styles.content}>
        <Text color="textSecondary" variant="body2Regular">
          {title}
        </Text>
        {hasDescription && (
          <View style={styles.descriptionRow}>
            <Text
              color="textMuted"
              variant="body2LongRegular"
              numberOfLines={isExpanded ? undefined : 1}
              ellipsizeMode="tail"
              style={styles.descriptionText}
            >
              {description}
            </Text>
            {!isExpanded && (
              <IconChevronDown
                width={20}
                height={20}
                color={theme.colors.textMuted}
              />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = createStyles({
  card: (theme) => ({
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.interactiveNeutral2Default,
    cursor: "pointer",
  }),
  cardHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  emoji: {
    paddingVertical: 2,
  },
  content: {
    flex: 1,
    paddingVertical: 2,
    gap: 2,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  descriptionText: {
    flex: 1,
  },
});
