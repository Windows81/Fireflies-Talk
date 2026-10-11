import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { UpgradeBenefits } from "@/components/Paywall";
import { Text } from "@/components/Typography";
import { startUpgradeFlow, usePaywallConfig } from "@/features/billing";
import { createStyles, useTheme } from "@/styles";
import { PaywallVisibility } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { View } from "react-native";
import { DownloadPaywallVisual } from "./DownloadPaywallVisual";

/** Paywall id the upgrade flow reports; shared with the legacy download modal. */
const PWL = "desktop_download";

// The download itself is the offer here, so it is left out of the benefits.
const BENEFITS = [
  "Unlimited meeting notes",
  "Capture meeting video",
  "Custom summaries",
  "AskFred, Ask anything",
];

/**
 * Upgrade prompt shown when a free user tries to download a meeting asset. It
 * replaces the generic bottom-sheet paywall on desktop with a two-column layout
 * that names the format the user actually picked.
 */
export const DownloadPaywallDialog: FC<{
  /** Format the user tried to download (e.g. "DOCX"); `null` stays closed. */
  format: string | null;
  close: () => void;
}> = ({ format, close }) => {
  const theme = useTheme();
  const { visibility } = usePaywallConfig();

  const onUpgrade = () => {
    startUpgradeFlow({ pwl: PWL });
    close();
  };

  return (
    <Dialog.Root
      variant="basic"
      isOpen={!!format}
      close={close}
      style={styles.dialog(theme)}
      aria-label="Upgrade to download meetings"
    >
      <View style={styles.left}>
        <View style={styles.copy}>
          <Text variant="heading5Weight">
            Download this meeting{"\n"}as {format}
          </Text>
          <UpgradeBenefits labels={BENEFITS} gap={16} />
        </View>
        {visibility === PaywallVisibility.Show && (
          <Button
            variant="primary"
            size="sm"
            style={styles.cta}
            onPress={onUpgrade}
          >
            Upgrade to Download
          </Button>
        )}
      </View>
      <DownloadPaywallVisual />
      <Dialog.Close />
    </Dialog.Root>
  );
};

const styles = createStyles({
  // Fixed to the design's size, but capped at the viewport so a small window
  // squeezes the copy column instead of clipping the modal.
  dialog: (theme) => ({
    flexDirection: "row",
    width: 702,
    maxWidth: "100%",
    height: 414,
    maxHeight: "100%",
    borderRadius: 12,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
  }),
  left: {
    flex: 1,
    padding: 40,
    gap: 52,
  },
  copy: {
    gap: 24,
  },
  cta: {
    alignSelf: "flex-start",
  },
});
