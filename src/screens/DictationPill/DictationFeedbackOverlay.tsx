import { createStyles } from "@/styles";
import {
  DICTATION_FEEDBACK_GUTTER_X as GUTTER_X,
  DICTATION_FEEDBACK_GUTTER_Y as GUTTER_Y,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type {
  DictationFeedbackAction,
  DictationPillSide,
} from "electron/src/types";
import { useEffect, useState, type FC } from "react";
import { View } from "react-native";
import { DictationFeedbackCard } from "./DictationFeedbackCard";
import { pillCardEdgeAlignment } from "./dictationPillCardLayout";

/** Every card action goes to the main window, which owns the offer. */
const reportFeedbackAction = (action: DictationFeedbackAction) =>
  window.electron?.dictation.reportFeedbackAction?.(action);

/**
 * The feedback card's own window. It only knows which side of the pill it
 * hangs off; every action is relayed to the main window, which owns the
 * offer's persisted state and the submit mutation.
 */
export const DictationFeedbackOverlay: FC = () => {
  const [side, setSide] = useState<DictationPillSide>("bottom");

  useEffect(() => {
    void window.electron?.dictation.getSide?.().then((next) => {
      if (next) setSide(next);
    });
    return window.electron?.dictation.onSide(setSide);
  }, []);

  return (
    <View
      style={[styles.root, pillCardEdgeAlignment(side, GUTTER_X, GUTTER_Y)]}
    >
      <DictationFeedbackCard side={side} onAction={reportFeedbackAction} />
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
