import type { FC } from "react";
import { Pressable, View } from "react-native";
import { createStyles, useTheme } from "@/styles";
import { IconClose } from "@/assets/svg";
import { useBooleanState } from "@/utils/states";
import { Text } from "@/components/Typography";

export const DesktopWindowControls: FC = () => {
  const theme = useTheme();
  const [isMinHover, setMinHoverTrue, setMinHoverFalse] = useBooleanState();
  const [isCloseHover, setCloseHoverTrue, setCloseHoverFalse] =
    useBooleanState();

  const onMinimize = () => {
    window.electron?.window?.minimize?.();
  };

  const onClose = () => {
    window.electron?.window?.close?.();
  };

  return (
    <View style={styles.container} nativeID="no-drag">
      <Pressable
        onPress={onMinimize}
        aria-label="Minimize window"
        role="button"
        onHoverIn={setMinHoverTrue}
        onHoverOut={setMinHoverFalse}
        onPressIn={setMinHoverTrue}
        onPressOut={setMinHoverFalse}
        style={({ pressed }) => [
          styles.button,
          (isMinHover || pressed) && {
            backgroundColor: theme.colors.interactiveNeutral2Hover,
          },
        ]}
        hitSlop={6}
      >
        <Text variant="heading4" color="textPrimary">
          –
        </Text>
      </Pressable>
      <Pressable
        onPress={onClose}
        aria-label="Close window"
        role="button"
        onHoverIn={setCloseHoverTrue}
        onHoverOut={setCloseHoverFalse}
        onPressIn={setCloseHoverTrue}
        onPressOut={setCloseHoverFalse}
        style={({ pressed }) => [
          styles.button,
          (isCloseHover || pressed) && {
            backgroundColor: theme.colors.interactiveDangerPrimaryHover,
          },
        ]}
        hitSlop={6}
      >
        <IconClose width={24} height={24} color="#ffffff" />
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    height: 50,
    width: 80,
    flexDirection: "row",
    zIndex: 100,
  },
  button: {
    width: 40,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
