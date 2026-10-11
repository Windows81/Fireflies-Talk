import { IconX } from "@/assets/svg";
import { createStyles, useTheme, type Theme } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";

const CLOSE_CHIP_SIZE = 20;

interface DictationPillCardCloseChipProps {
  /** The card's own width; the chip overhangs its top-right corner. */
  cardWidth: number;
  onPress: () => void;
}

export const DictationPillCardCloseChip: FC<
  DictationPillCardCloseChipProps
> = ({ cardWidth, onPress }) => {
  const theme = useTheme();
  const overhang = { left: cardWidth - CLOSE_CHIP_SIZE + 3 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      style={[styles.close(theme), overhang]}
    >
      <IconX
        width={16}
        height={16}
        color={theme.colors.dictationTalkTeaserCloseIcon}
      />
    </Pressable>
  );
};

const styles = createStyles({
  close: (theme: Theme) => ({
    position: "absolute",
    top: -4,
    width: CLOSE_CHIP_SIZE,
    height: CLOSE_CHIP_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: theme.colors.dictationTalkTeaserCloseChip,
  }),
});
