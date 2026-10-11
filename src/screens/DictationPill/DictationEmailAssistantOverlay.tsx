import { createStyles } from "@/styles";
import {
  DICTATION_EMAIL_ASSISTANT_GUTTER_X as GUTTER_X,
  DICTATION_EMAIL_ASSISTANT_GUTTER_Y as GUTTER_Y,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type { FC } from "react";
import { View } from "react-native";
import { DictationEmailAssistantCard } from "./DictationEmailAssistantCard";
import { useDictationEmailAssistantCard } from "./useDictationEmailAssistantCard";
import { pillCardEdgeAlignment } from "./dictationPillCardLayout";

const handleConnect = () =>
  window.electron?.dictation.reportEmailAssistantNudgeAction?.("connect");

const handleClose = () =>
  window.electron?.dictation.reportEmailAssistantNudgeAction?.("close");

export const DictationEmailAssistantOverlay: FC = () => {
  const { side, provider } = useDictationEmailAssistantCard();

  if (!provider) return null;

  return (
    <View
      style={[styles.root, pillCardEdgeAlignment(side, GUTTER_X, GUTTER_Y)]}
    >
      <DictationEmailAssistantCard
        side={side}
        provider={provider}
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
