import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, RefObject } from "react";
import { Pressable, View } from "react-native";

type PillState = { pressed: boolean; hovered?: boolean };

interface NotepadHeaderPillProps {
  label: string;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  triggerRef?: RefObject<View | null>;
}

export const NotepadHeaderPill: FC<NotepadHeaderPillProps> = ({
  label,
  onPress,
  active,
  disabled,
  triggerRef,
}) => {
  const theme = useTheme();

  return (
    <Pressable ref={triggerRef} onPress={onPress} disabled={disabled}>
      {({ hovered }: PillState) => {
        const highlighted = !disabled && (hovered || active);
        return (
          <View
            style={[
              styles.pill(theme),
              highlighted && styles.pillActive(theme),
            ]}
          >
            <Text
              variant="body2Regular"
              color={highlighted ? "textSecondary" : "textHint"}
            >
              {label}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = createStyles({
  pill: (theme) => ({
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  }),
  pillActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
    borderColor: theme.colors.borderInteractiveHover,
  }),
});
