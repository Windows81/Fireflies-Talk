import { IconPause, IconPlay } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";
import type { HoverProps } from "./useStickyHover";

export const AudioPlayButton: FC<{
  paused: boolean;
  onPress: () => void;
  hoverProps: HoverProps;
}> = ({ paused, onPress, hoverProps }) => {
  const theme = useTheme();
  const color = theme.colors.commandContrastDefault;

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      hitSlop={8}
      role="button"
      aria-label={paused ? "Play" : "Pause"}
      style={styles.button(theme)}
    >
      {paused ? (
        <IconPlay color={color} width={16} height={16} />
      ) : (
        <IconPause color={color} width={16} height={16} />
      )}
    </Pressable>
  );
};

const styles = createStyles({
  button: (theme) => ({
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.interactivePrimaryDefault,
    borderRadius: 9999,
    padding: 8,
  }),
});
