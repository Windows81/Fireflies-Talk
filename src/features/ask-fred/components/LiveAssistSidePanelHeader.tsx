import { IconClose, IconFred } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { TouchableOpacity, View } from "react-native";

export const LiveAssistSidePanelHeader: FC<{
  onClose?: () => void;
  showFredIcon?: boolean;
  /** Hidden while a paywall stands in for the thread — there are no credits to spend. */
  showCreditsHint?: boolean;
}> = ({ onClose, showFredIcon = true, showCreditsHint = true }) => {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showFredIcon && <IconFred width={24} height={24} />}
        <Text variant="body2Weight" color="textPrimary">
          AskFred
        </Text>
      </View>
      <View style={styles.headerRight}>
        {showCreditsHint && (
          <Text fontSize={12} color="commandNeutralDisabled">
            Consumes AI credits
          </Text>
        )}
        {onClose && (
          <TouchableOpacity
            aria-label="Close LiveAssist"
            onPress={onClose}
            role="button"
            style={styles.closeButton}
          >
            <IconClose
              color={theme.colors.commandNeutralDefault}
              width={18}
              height={18}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
});
