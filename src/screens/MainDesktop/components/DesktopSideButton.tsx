import {
  IconGoogleCalendar,
  IconOutlook,
  IconChevronsLeft,
  IconChevronsRight,
} from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useState, useRef, useEffect, type FC } from "react";
import { View, Animated, Pressable } from "react-native";

interface DesktopSideButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  upcomingCount: number;
  isOutlook?: boolean;
  isSmallWindow?: boolean;
}

export const DesktopSideButton: FC<DesktopSideButtonProps> = ({
  isCollapsed,
  onToggle,
  upcomingCount,
  isOutlook,
  isSmallWindow,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const hoverAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(hoverAnim, {
      toValue: isHovered ? 1.1 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isHovered, hoverAnim]);

  const calendarIcon = isOutlook ? (
    <IconOutlook width={24} height={24} />
  ) : (
    <IconGoogleCalendar width={24} height={24} />
  );

  return (
    <Pressable
      onPress={onToggle}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.toggleButton(theme),
        isSmallWindow
          ? isCollapsed
            ? styles.positionSmallCollapsed(theme)
            : styles.positionSmallExpanded(theme)
          : styles.positionAnchoredRight,
      ]}
    >
      <Animated.View
        style={[
          styles.toggleButtonInner,
          { transform: [{ scale: hoverAnim }] },
        ]}
      >
        {isCollapsed ? (
          <View style={styles.collapsedContent}>
            {isHovered ? (
              <IconChevronsLeft
                width={24}
                height={24}
                color={theme.colors.textSecondary}
              />
            ) : (
              calendarIcon
            )}
            <Text
              variant="body3Regular"
              color="textSecondary"
              style={styles.collapsedText}
            >
              {upcomingCount} Upcoming
            </Text>
          </View>
        ) : (
          <IconChevronsRight
            width={20}
            height={20}
            color={theme.colors.textSecondary}
          />
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = createStyles({
  toggleButton: (theme) => ({
    position: "absolute",
    top: "50%",
    zIndex: 10,
    backgroundColor: theme.colors.interactiveSecondaryDisabled,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 0,
    borderColor: theme.colors.borderStaticSubtle,
    borderRightColor: theme.colors.interactiveSecondaryDisabled,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    padding: 10,
    overflow: "hidden",
  }),
  toggleButtonInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  collapsedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collapsedText: {
    marginRight: 12,
  },
  positionAnchoredRight: {
    right: 0,
    transform: [{ translateY: -20 }],
  },
  positionSmallCollapsed: (theme) => ({
    right: 0,
    left: "auto",
    transform: [{ translateY: -20 }],
    backgroundColor: theme.colors.interactiveSecondaryDisabled,
  }),
  positionSmallExpanded: (theme) => ({
    right: 279,
    left: "auto",
    backgroundColor: theme.colors.layerDefault,
  }),
});
