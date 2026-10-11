import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { Pressable, View } from "react-native";
import type { AssistAction } from "../../Notes/DynamicAssistActionItem";

const renderLabel = (label: string) => {
  const parenIndex = label.indexOf("(");
  if (parenIndex <= 0) {
    return (
      <Text variant="body2Regular" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    );
  }
  return (
    <Text variant="body2Regular" color="textSecondary" numberOfLines={1}>
      {label.slice(0, parenIndex)}
      <Text variant="body2Regular" color="textMuted">
        {label.slice(parenIndex)}
      </Text>
    </Text>
  );
};

export const LiveAssistGridCard: FC<{
  action: AssistAction;
  onPress: () => void;
  disabled?: boolean;
}> = ({ action, onPress, disabled }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();
  const Icon = action.Icon;
  const label = typeof action.label === "string" ? action.label : "";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.card(theme), isHovered && styles.cardHovered(theme)]}
      {...webHoverProps}
    >
      {Icon && (
        <View style={styles.icon}>
          <Icon />
        </View>
      )}
      <View style={styles.text}>{renderLabel(label)}</View>
    </Pressable>
  );
};

const styles = createStyles({
  card: (theme) => ({
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.interactiveNeutral2Default,
    cursor: "pointer",
  }),
  cardHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  icon: {
    paddingVertical: 2,
  },
  text: {
    flex: 1,
    paddingVertical: 2,
  },
});
