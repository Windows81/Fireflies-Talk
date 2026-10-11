import { IconCheck } from "@/assets/svg";
import { MenuPopover } from "@/components/Menu";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useEffect, useRef, type FC } from "react";
import { Pressable, View } from "react-native";
import type { HoverProps } from "./useStickyHover";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

type RowState = { pressed: boolean; hovered?: boolean };

const formatRate = (rate: number) => `${rate}x`;

export const AudioSpeedControl: FC<{
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  hoverProps: HoverProps;
  onOpenChange?: (open: boolean) => void;
}> = ({ playbackRate, setPlaybackRate, hoverProps, onOpenChange }) => {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();

  // Keep the player expanded while the menu is open (pointer leaves the pill).
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const select = (rate: number) => {
    setPlaybackRate(rate);
    close();
  };

  return (
    <>
      <Pressable
        {...hoverProps}
        ref={triggerRef}
        onPress={open}
        hitSlop={8}
        role="button"
        aria-label={`Playback speed ${playbackRate}x`}
        style={styles.trigger}
      >
        <Text fontSize={12} fontWeight="500" color="commandHintDefault">
          {formatRate(playbackRate)}
        </Text>
      </Pressable>

      <MenuPopover
        isOpen={isOpen}
        close={close}
        triggerRef={triggerRef}
        width={140}
      >
        <View style={styles.list}>
          {SPEED_OPTIONS.map((rate) => {
            const isActive = rate === playbackRate;
            return (
              <Pressable key={rate} onPress={() => select(rate)}>
                {({ hovered }: RowState) => (
                  <View
                    style={[styles.row, hovered && styles.rowHovered(theme)]}
                  >
                    <Text
                      variant="body2Regular"
                      color="textSecondary"
                      style={styles.label}
                    >
                      {formatRate(rate)}
                    </Text>
                    {isActive && (
                      <IconCheck
                        width={16}
                        height={16}
                        color={theme.colors.textPrimary}
                      />
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </MenuPopover>
    </>
  );
};

const styles = createStyles({
  trigger: {
    height: 32,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rowHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  label: {
    flex: 1,
  },
});
