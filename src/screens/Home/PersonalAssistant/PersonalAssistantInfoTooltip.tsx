import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";

export const PersonalAssistantInfoTooltip: FC<{
  visible: boolean;
  onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <>
      <Pressable style={styles.tooltipBackdrop} onPress={onDismiss} />
      <View
        style={[
          styles.tooltip,
          {
            backgroundColor: theme.colors.layerDefault,
            borderColor: theme.colors.borderStaticSubtle,
          },
        ]}
      >
        <Text variant="body3Regular" color="textSecondary">
          Each AI Skill consumes 1 AI credit / output.
        </Text>
      </View>
    </>
  );
};

const styles = createStyles({
  tooltipBackdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 10,
  },
  tooltip: {
    position: "absolute",
    top: 28,
    left: -80,
    zIndex: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    width: 220,
  },
});
