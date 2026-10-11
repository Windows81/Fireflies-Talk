import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";

export const SsoLoginButton: FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable style={styles.button} onPress={onPress} tabIndex={-1}>
    <Text variant="link3Regular" color="commandNeutralDefault">
      Use Single Sign-On
    </Text>
  </Pressable>
);

const styles = createStyles({
  button: {
    alignItems: "center",
    cursor: "pointer",
  },
});
