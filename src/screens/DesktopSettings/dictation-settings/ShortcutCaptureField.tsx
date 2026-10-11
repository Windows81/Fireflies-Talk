import { IconX } from "@/assets/svg/svgs.gen";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import type { ShortcutKeycap } from "electron/src/dictation/shortcut-keys";
import type { FC } from "react";
import { View } from "react-native";
import { ShortcutIconButton } from "./ShortcutIconButton";
import { ShortcutKeycaps } from "./ShortcutKeycaps";
import { ShortcutItem } from "./ShortcutRow";

interface ShortcutCaptureFieldProps {
  keycaps: ShortcutKeycap[];
  onCancel: () => void;
}

export const ShortcutCaptureField: FC<ShortcutCaptureFieldProps> = ({
  keycaps,
  onCancel,
}) => {
  const theme = useTheme();

  return (
    <ShortcutItem
      actions={
        <ShortcutIconButton
          accessibilityLabel="Cancel recording"
          Icon={IconX}
          onPress={onCancel}
        />
      }
    >
      <View style={styles.captureField(theme)}>
        {keycaps.length ? (
          <ShortcutKeycaps keycaps={keycaps} />
        ) : (
          <Text variant="body2Regular" color="textMuted">
            Press a shortcut…
          </Text>
        )}
      </View>
    </ShortcutItem>
  );
};

const styles = createStyles({
  captureField: (theme) => ({
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: withAlpha(theme.colors.borderInteractiveActive, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveActive,
  }),
});
