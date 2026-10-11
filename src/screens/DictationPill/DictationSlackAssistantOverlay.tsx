import { createStyles } from "@/styles";
import {
  DICTATION_SLACK_ASSISTANT_GUTTER_X as GUTTER_X,
  DICTATION_SLACK_ASSISTANT_GUTTER_Y as GUTTER_Y,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type { DictationPillSide } from "electron/src/types";
import { useEffect, useState, type FC } from "react";
import { View } from "react-native";
import { DictationSlackAssistantCard } from "./DictationSlackAssistantCard";
import { pillCardEdgeAlignment } from "./dictationPillCardLayout";

const handleConnect = () =>
  window.electron?.dictation.reportSlackAssistantNudgeAction?.("connect");

const handleClose = () =>
  window.electron?.dictation.reportSlackAssistantNudgeAction?.("close");

export const DictationSlackAssistantOverlay: FC = () => {
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
      <DictationSlackAssistantCard
        side={side}
        onConnect={handleConnect}
        onClose={handleClose}
      />
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
