import { IconArrowLeft } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { useNavigation } from "@react-navigation/native";
import type { FC } from "react";
import { Pressable } from "react-native";

/**
 * The notepad's top-left back control. `onBack` overrides the default
 * navigation.goBack() — used when the notepad renders inside the Live window
 * (no nav stack), where back must close that window and focus main instead.
 */
export const NotepadBackButton: FC<{ onBack?: () => void }> = ({ onBack }) => {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <Pressable
      nativeID="no-drag"
      style={styles.root}
      onPress={() => (onBack ? onBack() : navigation.goBack())}
      aria-label="Back"
    >
      <IconArrowLeft
        width={20}
        height={20}
        color={theme.colors.commandNeutralDefault}
      />
    </Pressable>
  );
};

const styles = createStyles({
  root: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
});
