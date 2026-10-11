import { Button } from "@/components/Button";
import type { FC } from "react";
import { useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { ManualLoginTextInput } from "./ManualLoginTextInput";
import { useManualLogin, type ManualLoginProps } from "./useManualLogin";

/** Collapsed behind a "Login manually" button, with an explicit Submit. */
export const ManualLogin: FC<ManualLoginProps> = ({ onLogin }) => {
  const [visible, setVisible] = useState(false);
  const login = useManualLogin({ onLogin });

  if (!visible) {
    return (
      <Button variant="transparentNeutral" onPress={() => setVisible(true)}>
        Login manually
      </Button>
    );
  }

  return (
    <Animated.View style={styles.container}>
      <ManualLoginTextInput
        login={login}
        placeholder="Enter the authentication URL"
        autoFocus
        style={styles.input}
      />
      <Button onPress={login.submit} disabled={!login.canSubmit}>
        Submit
      </Button>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
  },
});
