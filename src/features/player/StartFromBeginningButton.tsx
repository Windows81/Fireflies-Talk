import { Text } from "@/components/Typography";
import { GLOBAL, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useResumePlayback } from "./PlayerContext";

export const StartFromBeginningButton: FC<{
  variant?: "overlay" | "inline";
}> = ({ variant = "overlay" }) => {
  const { resumedFromPosition, startFromBeginning } = useResumePlayback();

  if (resumedFromPosition === null) return null;

  const isInline = variant === "inline";

  return (
    <TouchableOpacity
      onPress={startFromBeginning}
      style={isInline ? styles.inlineButton : styles.button}
      hitSlop={8}
      role="button"
      aria-label="Start from beginning"
    >
      <Text
        fontSize={isInline ? 12 : 14}
        fontWeight="500"
        color={isInline ? "commandHintDefault" : undefined}
        style={isInline ? undefined : styles.label}
      >
        Start from beginning
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: withAlpha(GLOBAL.black, 0.5),
    borderRadius: 9999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    height: 24,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: GLOBAL.white,
  },
});
