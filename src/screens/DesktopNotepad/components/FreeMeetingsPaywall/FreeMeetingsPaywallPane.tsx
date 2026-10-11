import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import {
  FreeMeetingsUpgradeCard,
  type FreeMeetingsSurface,
} from "./FreeMeetingsUpgradeCard";
import { SummaryNotesTeaser } from "./SummaryNotesTeaser";
import { TasksTeaser } from "./TasksTeaser";

/** The offer, and the content it stands in for, for each pane. */
const SURFACES: Record<FreeMeetingsSurface, { title: string; Teaser: FC }> = {
  summary: {
    title: "Upgrade to get unlimited summary notes",
    Teaser: SummaryNotesTeaser,
  },
  tasks: {
    title: "Upgrade to get unlimited meeting tasks",
    Teaser: TasksTeaser,
  },
};

/**
 * Takes over a notepad pane once the team is out of free meetings: the meeting
 * was never transcribed, so the upgrade offer sits over a blurred glimpse of
 * the notes or tasks that would have filled it.
 */
export const FreeMeetingsPaywallPane: FC<{
  surface: FreeMeetingsSurface;
  showUpgrade: boolean;
}> = ({ surface, showUpgrade }) => {
  const { title, Teaser } = SURFACES[surface];

  return (
    <View style={styles.container}>
      <Teaser />
      {/* Lifts the card over the absolutely positioned teaser behind it. */}
      <View style={styles.cardLayer}>
        <FreeMeetingsUpgradeCard
          title={title}
          surface={surface}
          showUpgrade={showUpgrade}
        />
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    alignItems: "center",
    paddingVertical: 56,
    overflow: "hidden",
  },
  cardLayer: {
    zIndex: 1,
    maxWidth: "100%",
  },
});
