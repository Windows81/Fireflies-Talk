import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, type Theme } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";

interface DictationPillCardButtonProps {
  onPress: () => void;
  children: string;
}

export const DictationPillCardButton: FC<DictationPillCardButtonProps> = ({
  onPress,
  children,
}) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button(theme), isHovered && styles.buttonHover(theme)]}
      {...webHoverProps}
    >
      <Text variant="label2Weight" color="dictationTalkTeaserButtonText">
        {children}
      </Text>
    </Pressable>
  );
};

const styles = createStyles({
  button: (theme: Theme) => ({
    width: 289,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    cursor: "pointer",
    borderColor: theme.colors.dictationTalkTeaserButtonBorder,
    backgroundColor: theme.colors.dictationTalkTeaserButtonSurface,
    boxShadow: `0 2px 2px ${theme.colors.dictationTalkTeaserButtonShadow}`,
  }),
  buttonHover: (theme: Theme) => ({
    backgroundColor: theme.colors.dictationTalkTeaserButtonSurfaceHover,
  }),
});
