import { IconDesktop } from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import type { DictationEntry } from "@/hooks/dictationHistory";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { PASTE_TARGET_ICONS } from "./pasteTargetIcons";

interface PasteTargetIconProps {
  app: string;
  size?: number;
}

interface DictationPasteTargetProps {
  entry: DictationEntry;
}

const ICON_SIZE = 16;

export const PasteTargetIcon: FC<PasteTargetIconProps> = ({
  app,
  size = ICON_SIZE,
}) => {
  const theme = useTheme();
  // `app` comes from persisted history, so a bare index would return an
  // inherited Object.prototype member ("constructor") and render a non-component.
  const Icon = Object.prototype.hasOwnProperty.call(PASTE_TARGET_ICONS, app)
    ? PASTE_TARGET_ICONS[app]
    : undefined;

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      {Icon ? (
        // Brands whose mark is a solid silhouette (GitHub, Threads, X…) ship as
        // currentColor, so they follow the theme instead of vanishing on dark.
        <Icon width={size} height={size} color={theme.colors.textPrimary} />
      ) : (
        <IconDesktop
          width={size}
          height={size}
          color={theme.colors.textMuted}
        />
      )}
    </View>
  );
};

export const DictationPasteTarget: FC<DictationPasteTargetProps> = ({
  entry,
}) => {
  if (entry.pasted === false) {
    return (
      <Text variant="body2Regular" color="textMuted">
        Not pasted
      </Text>
    );
  }
  if (!entry.pastedApp) return null;

  const label = `Pasted on ${entry.pastedApp}`;

  return (
    <HoverTooltip label={label} position="top" align="center">
      <View accessibilityLabel={label}>
        <PasteTargetIcon app={entry.pastedApp} />
      </View>
    </HoverTooltip>
  );
};

const styles = createStyles({
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
