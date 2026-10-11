import { createStyles, useTheme, vars } from "@/styles";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StyleProp, ViewStyle } from "react-native";
import { Modal, Pressable, View } from "react-native";
import { useWindowDimensions } from "react-native";

interface MenuPopoverProps {
  isOpen: boolean;
  close: () => void;
  children: ReactNode;
  triggerRef?: React.RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
  width?: number;
  placement?: "bottom" | "right" | "top";
  /** Horizontal alignment relative to the trigger for top/bottom placement. */
  align?: "start" | "end";
  /** Extra gap (px) between the trigger and the popover, added to the default. */
  offset?: number;
  contentRef?: React.RefObject<View | null>;
  disableBackdrop?: boolean;
}

export const MenuPopover: FC<MenuPopoverProps> = ({
  isOpen,
  close,
  children,
  triggerRef,
  style,
  width: customWidth,
  placement = "bottom",
  align = "end",
  offset = 0,
  contentRef,
  disableBackdrop = false,
}) => {
  const theme = useTheme();
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const [triggerPosition, setTriggerPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const measureTrigger = useCallback(() => {
    if (triggerRef?.current) {
      triggerRef.current.measureInWindow?.(
        (x: number, y: number, width: number, height: number) => {
          setTriggerPosition({ x, y, width, height });
        },
      );
    }
  }, [triggerRef]);

  // Measure trigger position when menu opens
  if (isOpen && !triggerPosition && triggerRef) {
    measureTrigger();
  }

  // Reset position when menu closes
  if (!isOpen && triggerPosition) {
    setTimeout(() => setTriggerPosition(null), 0);
  }

  // Close menu when Electron window loses focus
  useEffect(() => {
    if (!isOpen) return;

    const cleanup = window.electron?.onWindowBlur?.(() => {
      close();
    });

    return cleanup;
  }, [isOpen, close]);

  if (!triggerPosition) {
    return null;
  }

  const MARGIN = 8;
  const GUTTER = 4;
  const DEFAULT_WIDTH = customWidth || 180;

  // Width calculation
  const dropdownWidth = Math.min(
    DEFAULT_WIDTH,
    Math.max(0, viewportWidth - MARGIN * 2),
  );

  let left = 0;
  let top = 0;
  let bottomOffset: number | undefined;
  let maxHeight = 400;

  if (placement === "top") {
    const leftAligned = triggerPosition.x;
    const leftRightAligned =
      triggerPosition.x + triggerPosition.width - dropdownWidth;
    left = align === "start" ? leftAligned : leftRightAligned;
    if (align === "end" && left < MARGIN) {
      left = leftAligned;
    }
    left = Math.max(
      MARGIN,
      Math.min(left, viewportWidth - MARGIN - dropdownWidth),
    );
    const spaceAbove = triggerPosition.y - MARGIN;
    maxHeight = Math.min(400, Math.max(100, spaceAbove));
    bottomOffset = viewportHeight - triggerPosition.y + GUTTER + offset;
  } else if (placement === "right") {
    // Try to position to the right first
    const spaceRight =
      viewportWidth - (triggerPosition.x + triggerPosition.width) - MARGIN;
    const spaceBelow = viewportHeight - triggerPosition.y - MARGIN;
    const spaceLeft = triggerPosition.x - MARGIN;

    // Check if there's enough space to the right (be more lenient - allow 50% overflow)
    const canPlaceRight = spaceRight >= dropdownWidth * 0.5;
    // Check if there's enough space to the left as fallback
    const canPlaceLeft = spaceLeft >= dropdownWidth;

    if (canPlaceRight) {
      // Position to the right (preferred)
      left = triggerPosition.x + triggerPosition.width + GUTTER;
      top = triggerPosition.y;
      maxHeight = Math.min(400, Math.max(100, spaceBelow));

      // Ensure menu doesn't overflow viewport horizontally
      // But also ensure it doesn't overlap with the trigger (main menu)
      if (left + dropdownWidth > viewportWidth - MARGIN) {
        const adjustedLeft = viewportWidth - MARGIN - dropdownWidth;
        // Only adjust if it doesn't cause overlap with trigger
        if (
          adjustedLeft >=
          triggerPosition.x + triggerPosition.width + GUTTER
        ) {
          left = adjustedLeft;
        }
        // Otherwise keep original position (may overflow viewport but won't overlap trigger)
      }

      // Ensure menu doesn't overflow viewport vertically
      if (top + maxHeight > viewportHeight - MARGIN) {
        top = Math.max(MARGIN, viewportHeight - MARGIN - maxHeight);
      }
    } else if (canPlaceLeft) {
      // Fallback to left placement if not enough space on right
      left = Math.max(MARGIN, triggerPosition.x - dropdownWidth - GUTTER);
      top = triggerPosition.y;
      maxHeight = Math.min(400, Math.max(100, spaceBelow));

      // Ensure menu doesn't overflow viewport vertically
      if (top + maxHeight > viewportHeight - MARGIN) {
        top = Math.max(MARGIN, viewportHeight - MARGIN - maxHeight);
      }
    } else {
      // Last resort: place to the right anyway, even with overflow
      left = triggerPosition.x + triggerPosition.width + GUTTER;
      top = triggerPosition.y;
      maxHeight = Math.min(400, Math.max(100, spaceBelow));

      // Keep it within viewport bounds if possible, but don't overlap with trigger
      if (left + dropdownWidth > viewportWidth - MARGIN) {
        const adjustedLeft = viewportWidth - MARGIN - dropdownWidth;
        // Only adjust if it doesn't cause overlap with trigger
        if (
          adjustedLeft >=
          triggerPosition.x + triggerPosition.width + GUTTER
        ) {
          left = adjustedLeft;
        }
        // Otherwise keep original position (prefer overflow over overlap)
      }

      // Ensure menu doesn't overflow viewport vertically
      if (top + maxHeight > viewportHeight - MARGIN) {
        top = Math.max(MARGIN, viewportHeight - MARGIN - maxHeight);
      }
    }
  } else {
    // Default bottom placement
    const leftAligned = triggerPosition.x;
    const leftRightAligned =
      triggerPosition.x + triggerPosition.width - dropdownWidth;
    left = align === "start" ? leftAligned : leftRightAligned;

    if (align === "end" && left < MARGIN) {
      left = leftAligned;
    }

    left = Math.max(
      MARGIN,
      Math.min(left, viewportWidth - MARGIN - dropdownWidth),
    );

    const spaceBelow =
      viewportHeight - (triggerPosition.y + triggerPosition.height) - MARGIN;
    const spaceAbove = triggerPosition.y - MARGIN;
    const placeBelow = spaceBelow >= Math.min(spaceAbove, 200);

    if (placeBelow) {
      top = triggerPosition.y + triggerPosition.height + GUTTER;
      maxHeight = Math.min(400, Math.max(100, spaceBelow));
    } else {
      // Not enough room below: anchor the popover's bottom edge above the
      // trigger so it opens upward instead of overlapping it.
      bottomOffset = viewportHeight - triggerPosition.y + GUTTER + offset;
      maxHeight = Math.min(400, Math.max(100, spaceAbove - GUTTER));
    }
  }

  const positionStyle =
    bottomOffset != null
      ? { left, bottom: bottomOffset, width: dropdownWidth, maxHeight }
      : { left, top, width: dropdownWidth, maxHeight };

  const dropdownContent = (
    <View
      ref={contentRef}
      style={[
        webStyles.dropdown(theme),
        positionStyle,
        disableBackdrop &&
          ({ position: "fixed", zIndex: 10001 } as unknown as ViewStyle),
        style,
      ]}
    >
      {children}
    </View>
  );

  // When disableBackdrop is true, render via portal instead of Modal
  // to avoid the Modal's blocking overlay that intercepts hover/click events
  if (disableBackdrop && isOpen) {
    return createPortal(dropdownContent, document.body);
  }

  return (
    <Modal
      transparent
      visible={isOpen}
      onRequestClose={close}
      animationType="none"
    >
      <Pressable
        style={webStyles.backdrop}
        onPress={close}
        nativeID="no-drag"
      />
      {dropdownContent}
    </Modal>
  );
};

const webStyles = createStyles({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdown: (theme) => ({
    ...vars.elevations[2],
    position: "absolute",
    backgroundColor: theme.colors.layerStrong,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    overflow: "hidden",
    paddingVertical: 4,
    backdropFilter: "blur(10px)",
  }),
});
