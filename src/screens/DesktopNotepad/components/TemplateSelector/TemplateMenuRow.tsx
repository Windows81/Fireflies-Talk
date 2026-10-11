import { IconCheck, IconChevronRight } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, RefObject } from "react";
import { useState } from "react";
import type { View } from "react-native";
import { Pressable } from "react-native";
import type { SvgProps } from "react-native-svg";

interface TemplateMenuRowProps {
  label: string;
  icon?: FC<SvgProps>;
  selected?: boolean;
  hasSubmenu?: boolean;
  active?: boolean;
  onPress?: () => void;
  onHoverIn?: () => void;
  rowRef?: RefObject<View | null>;
}

export const TemplateMenuRow: FC<TemplateMenuRowProps> = ({
  label,
  icon: Icon,
  selected,
  hasSubmenu,
  active,
  onPress,
  onHoverIn,
  rowRef,
}) => {
  const theme = useTheme();
  // Explicit hover state: the Pressable `hovered` render-prop is unreliable
  // inside the portal-rendered submenu, so drive the highlight ourselves.
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      ref={rowRef}
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
        onHoverIn?.();
      }}
      onHoverOut={() => setHovered(false)}
      style={[styles.row, (hovered || active) && styles.rowActive(theme)]}
    >
      {Icon && (
        <Icon
          width={16}
          height={16}
          color={theme.colors.commandNeutralDefault}
        />
      )}
      <Text
        variant="body2Regular"
        color="textSecondary"
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
      {selected && (
        <IconCheck
          width={16}
          height={16}
          color={theme.colors.commandNeutralDefault}
        />
      )}
      {hasSubmenu && (
        <IconChevronRight
          width={16}
          height={16}
          color={theme.colors.textHint}
        />
      )}
    </Pressable>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rowActive: (theme) => ({
    // interactiveNeutral2Hover matches the popover's layerStrong background in
    // the desktop theme, so the highlight would be invisible; use neutral1.
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
  label: {
    flex: 1,
  },
});
