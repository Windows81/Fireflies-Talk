import { createStyles } from "@/styles";
import {
  DICTATION_TALK_TEASER_GUTTER_X as GUTTER_X,
  DICTATION_TALK_TEASER_GUTTER_Y as GUTTER_Y,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type {
  DictationPillSide,
  DictationTeaserContent,
} from "electron/src/types";
import { useEffect, useState, type FC } from "react";
import { View } from "react-native";
import { DictationTalkTeaserCard } from "./DictationTalkTeaserCard";
import { pillCardEdgeAlignment } from "./dictationPillCardLayout";

/**
 * The card's own window. It only knows which side of the pill it hangs off and
 * what it is meant to say; Try and Close are relayed to the main window, which
 * owns the teaser's persisted state and the onboarding.
 */
export const DictationTalkTeaserOverlay: FC = () => {
  const [side, setSide] = useState<DictationPillSide>("bottom");
  // Nothing until the window says what it is for: it is revealed on load,
  // before the first content arrives, and a nudge would flash the
  // introduction's copy on its way in.
  const [content, setContent] = useState<DictationTeaserContent>();

  useEffect(() => {
    void window.electron?.dictation.getSide?.().then((next) => {
      if (next) setSide(next);
    });
    return window.electron?.dictation.onSide(setSide);
  }, []);

  useEffect(() => {
    let pushed = false;
    void window.electron?.dictation.getTeaserContent?.().then((next) => {
      if (next && !pushed) setContent(next);
    });
    // A null arrives as the card is being taken down; keeping the last content
    // avoids it flashing the introduction on its way out.
    return window.electron?.dictation.onTeaserContent?.((next) => {
      pushed = true;
      if (next) setContent(next);
    });
  }, []);

  // Both cards are the introduction's height — a nudge fills it by letting the
  // milestone's name run to a second line. The card hugs the pill-facing edge
  // of the larger transparent window so its arrow stays on the pill.
  return (
    <View
      style={[styles.root, pillCardEdgeAlignment(side, GUTTER_X, GUTTER_Y)]}
    >
      {content && (
        <DictationTalkTeaserCard
          side={side}
          content={content}
          onTry={() => window.electron?.dictation.reportTeaserAction?.("try")}
          onClose={() =>
            window.electron?.dictation.reportTeaserAction?.("close")
          }
        />
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
