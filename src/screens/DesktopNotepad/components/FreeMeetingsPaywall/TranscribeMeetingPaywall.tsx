import { IconScript } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { PaywallIconChip } from "./PaywallIconChip";

/**
 * Stands in for the transcript once the team is out of free meetings. It only
 * explains the gap: the upgrade CTA lives on the summary paywall next to it and
 * in the notepad nav bar.
 */
export const TranscribeMeetingPaywall: FC = () => (
  <View style={styles.container}>
    <View style={styles.content}>
      <PaywallIconChip Icon={IconScript} />
      <View style={styles.copy}>
        <Text variant="title2Regular" color="textSecondary">
          Upgrade to transcribe meeting
        </Text>
        <Text
          variant="body2Regular"
          color="textMuted"
          style={styles.description}
        >
          You have no free meetings left. Upgrade to transcribe unlimited
          meetings
        </Text>
      </View>
    </View>
  </View>
);

const styles = createStyles({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  // The design sits the block 80px above the pane's vertical center.
  content: {
    alignItems: "center",
    gap: 20,
    transform: [{ translateY: -80 }],
  },
  copy: {
    alignItems: "center",
    gap: 6,
  },
  description: {
    // Holds the design's two-line break instead of stretching across the pane.
    maxWidth: 330,
    textAlign: "center",
  },
});
