import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { type ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

export interface SegmentTabItem<T extends string> {
  value: T;
  label: string;
  badgeCount?: number;
  renderTrailing?: (isActive: boolean) => ReactNode;
}

interface SegmentTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: SegmentTabItem<T>[];
  style?: ViewStyle;
}

interface SegmentTabButtonProps<T extends string> {
  item: SegmentTabItem<T>;
  isActive: boolean;
  onPress: () => void;
}

function SegmentTabButton<T extends string>({
  item,
  isActive,
  onPress,
}: SegmentTabButtonProps<T>) {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      onPress={onPress}
      {...webHoverProps}
      style={[
        styles.trigger,
        isHovered && !isActive && styles.triggerHover(theme),
        isActive && styles.triggerActive(theme),
      ]}
    >
      <Text
        variant="title3Weight"
        color={isActive ? "textSecondary" : "textMuted"}
      >
        {item.label}
      </Text>
      {!!item.badgeCount && (
        <View style={styles.badge}>
          <Text variant="body3Regular" style={styles.badgeText}>
            {item.badgeCount}
          </Text>
        </View>
      )}
      {item.renderTrailing?.(isActive)}
    </Pressable>
  );
}

export function SegmentTabs<T extends string>({
  value,
  onValueChange,
  items,
  style,
}: SegmentTabsProps<T>) {
  return (
    <View style={[styles.track, style]}>
      {items.map((item) => (
        <SegmentTabButton
          key={item.value}
          item={item}
          isActive={item.value === value}
          onPress={() => onValueChange(item.value)}
        />
      ))}
    </View>
  );
}

const styles = createStyles({
  track: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 2,
    padding: 4,
    borderRadius: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  triggerActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  triggerHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESKTOP_THEME.green25Badge,
  },
  badgeText: {
    color: DESKTOP_THEME.green400Badge,
  },
});
