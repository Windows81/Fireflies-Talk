import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { ActivityIndicator, View } from "react-native";

interface Pending3dsPanelProps {
  /** Re-open the bank's verification URL (popup may have been closed). */
  onRetry: () => void;
  /** Abort the pending flow and return to the form. */
  onCancel: () => void;
}

/**
 * Shown while we wait for the user to complete 3DS authentication in the
 * external browser. The hook polls the user query, so this panel just needs
 * to surface the wait state and give the user an escape hatch.
 */
export const Pending3dsPanel: FC<Pending3dsPanelProps> = ({
  onRetry,
  onCancel,
}) => (
  <View style={styles.outer}>
    <View style={styles.container}>
      <ActivityIndicator size="large" color={DESKTOP_THEME.purple600} />
      <View style={styles.header}>
        <Text variant="heading4Weight" color="textSecondary" textAlign="center">
          Verify your card to start your trial
        </Text>
        <Text variant="body2Regular" color="textMuted" textAlign="center">
          Your bank opened a verification window in your browser. Once you
          confirm, we&apos;ll start your trial automatically.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="md"
          onPress={onRetry}
          style={styles.retryButton}
        >
          <Text variant="label2Weight" color="layerContrast">
            Re-open verification
          </Text>
        </Button>
        <Button
          variant="text"
          size="md"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text variant="label2Weight" color="textHint">
            Cancel
          </Text>
        </Button>
      </View>
    </View>
  </View>
);

const styles = createStyles({
  outer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 16,
  },
  container: {
    width: 480,
    alignItems: "center",
    gap: 28,
  },
  header: {
    gap: 12,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: DESKTOP_THEME.purple600,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
