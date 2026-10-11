import { createStyles, useTheme } from "@/styles";
import { useRef, useState, type FC } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";
import { Text } from "@/components/Typography";
import type { HoverTooltipProps } from "./types";

export type { HoverTooltipProps, TooltipPosition } from "./types";

// react-dom is only available during web sessions; static import causes crash during native mobile bundling

const createPortal: (
  children: React.ReactNode,
  container: Element,
) => React.ReactPortal = require("react-dom").createPortal;

export const HoverTooltip: FC<HoverTooltipProps> = ({
  label,
  description,
  shortcut,
  children,
  position = "top",
  align = "center",
  style,
  disabled = false,
  tone = "default",
  tooltipOffset = 0,
}) => {
  const theme = useTheme();
  const containerRef = useRef<View>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const showTooltip =
    !disabled &&
    (label || description || shortcut) &&
    isHovered &&
    tooltipPosition;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y, width, height) => {
        setTooltipPosition({ x: x + tooltipOffset, y, width, height });
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTooltipPosition(null);
  };

  const getTooltipStyle = (): ViewStyle => {
    if (!tooltipPosition) return {};

    const TOOLTIP_OFFSET = 12;

    const horizontalStyle =
      align === "end"
        ? {
            right:
              window.innerWidth - (tooltipPosition.x + tooltipPosition.width),
          }
        : align === "start"
          ? {
              left: tooltipPosition.x,
            }
          : {
              left: tooltipPosition.x + tooltipPosition.width / 2,
              transform: [{ translateX: "-50%" }],
            };

    if (position === "top") {
      return {
        position: "fixed",
        top: tooltipPosition.y - TOOLTIP_OFFSET,
        ...horizontalStyle,
        ...(horizontalStyle.transform
          ? {
              transform: [
                ...horizontalStyle.transform,
                { translateY: "-100%" },
              ],
            }
          : { transform: [{ translateY: "-100%" }] }),
      } as unknown as ViewStyle;
    }

    return {
      position: "fixed",
      top: tooltipPosition.y + tooltipPosition.height + TOOLTIP_OFFSET,
      ...horizontalStyle,
    } as unknown as ViewStyle;
  };

  // Only the surface changes: the pill and live bar sit on their own neutral
  // dark glass, and the shared layer colour is blue enough to read as a
  // different component sitting on top of them.
  const toneStyle =
    tone === "pill"
      ? { backgroundColor: theme.colors.dictationPillTooltipSurface }
      : null;

  const shortcutBadge = shortcut ? (
    <View style={styles.shortcutBadge(theme)}>
      <Text variant="label3Regular" style={styles.shortcutText(theme)}>
        {shortcut}
      </Text>
    </View>
  ) : null;

  const tooltipContent = showTooltip ? (
    description ? (
      <View style={[styles.richTooltip(theme), getTooltipStyle(), toneStyle]}>
        {label && (
          <View style={styles.labelRow}>
            <Text variant="body2Weight" color="textSecondary">
              {label}
            </Text>
            {shortcutBadge}
          </View>
        )}
        <Text variant="body2Regular" color="textMuted">
          {description}
        </Text>
      </View>
    ) : (
      <View style={[styles.tooltip(theme), getTooltipStyle(), toneStyle]}>
        <View style={styles.labelRow}>
          <Text variant="body3Regular" color="textMuted" numberOfLines={1}>
            {label}
          </Text>
          {shortcutBadge}
        </View>
      </View>
    )
  ) : null;

  // Web-specific mouse event props (not in RN types but supported by react-native-web)
  const webProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return (
    <View ref={containerRef} style={[styles.container, style]} {...webProps}>
      {children}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </View>
  );
};

const styles = createStyles({
  container: {
    position: "relative",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shortcutBadge: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryHover,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  }),
  shortcutText: (theme) => ({
    color: theme.colors.commandContrastMuted,
    fontSize: 11,
    lineHeight: 14,
  }),
  tooltip: (theme) => ({
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderColor: theme.colors.borderStaticDefault,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10000,
    maxWidth: 320,
    backgroundColor: theme.colors.layerDefault,
    pointerEvents: "none",
  }),
  richTooltip: (theme) => ({
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10000,
    maxWidth: 320,
    backgroundColor: theme.colors.layerDefault,
    pointerEvents: "none",
  }),
  tooltipArrowBase: {
    position: "absolute",
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    pointerEvents: "none",
  },
  tooltipArrowTop: (theme) => ({
    bottom: -8,
    borderTopWidth: 8,
    borderTopColor: theme.colors.layerDefault,
  }),
  tooltipArrowBottom: (theme) => ({
    top: -8,
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.layerDefault,
  }),
});
