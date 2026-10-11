import { createStyles } from "@/styles";
import type { DictationPillSide } from "electron/src/types";
import { useEffect, useState, type FC } from "react";
import { View } from "react-native";
import { DictationAccessibilityPrompt } from "./DictationAccessibilityPrompt";
import { useDictationAccessibilityPrompt } from "./useDictationAccessibilityPrompt";

export const DictationAccessibilityOverlay: FC = () => {
  const prompt = useDictationAccessibilityPrompt({ standalone: true });
  const [side, setSide] = useState<DictationPillSide>("bottom");

  useEffect(() => {
    void window.electron?.dictation.getSide?.().then((next) => {
      if (next) setSide(next);
    });
    return window.electron?.dictation.onSide(setSide);
  }, []);

  return (
    <View
      style={[
        styles.root,
        side === "bottom" ? styles.rootBottom : styles.rootSide,
      ]}
    >
      {prompt.visible && (
        <DictationAccessibilityPrompt
          side={side}
          phase={prompt.phase}
          onDismiss={prompt.dismiss}
          onOpenSettings={prompt.openSettings}
        />
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  rootBottom: {
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  rootSide: {
    justifyContent: "center",
  },
});
