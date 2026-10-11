import {
  useIsTalkActionModeFlagOn,
  useIsTalkPolishActionFlagOn,
  useLocalSettings,
} from "@/features/settings";
import { getActualPlatform } from "@/utils/device";
import {
  actionBindingsEqual,
  defaultActionBinding,
  normalizeActionBinding,
} from "electron/src/dictation/action-binding";
import {
  defaultDictationBinding,
  dictationBindingsEqual,
  normalizeDictationBinding,
} from "electron/src/dictation/dictation-binding";
import {
  defaultPolishBinding,
  normalizePolishBinding,
  polishBindingsEqual,
} from "electron/src/dictation/polish-binding";
import { normalizeHandsFreeBinding } from "electron/src/dictation/hands-free-binding";
import { useEffect, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import {
  isShortcutRecordingBusy,
  subscribeShortcutRecordingBusy,
} from "./shortcutRecordingLock";
import { resetShortcutStatuses } from "./shortcutStatusReset";

export const DictationShortcutsReset: FC = () => {
  const {
    actionShortcut,
    dictationShortcut,
    handsFreeShortcut,
    polishShortcut,
    setActionShortcut,
    setDictationShortcut,
    setHandsFreeShortcut,
    setPolishShortcut,
  } = useLocalSettings();
  const actionModeAvailable = useIsTalkActionModeFlagOn();
  const platform = getActualPlatform();
  const polishAvailable =
    useIsTalkPolishActionFlagOn() && platform === "darwin";
  const [recordingBusy, setRecordingBusy] = useState(isShortcutRecordingBusy());

  useEffect(() => subscribeShortcutRecordingBusy(setRecordingBusy), []);

  const dictationDefault = defaultDictationBinding(platform);
  const actionDefault = defaultActionBinding(platform);
  const polishDefault = defaultPolishBinding(platform);
  const normalizedDictation = normalizeDictationBinding(
    dictationShortcut,
    platform,
  );
  const normalizedAction = normalizeActionBinding(actionShortcut, platform);
  const normalizedPolish = normalizePolishBinding(polishShortcut, platform);
  const handsFreeIsDefault =
    normalizeHandsFreeBinding(handsFreeShortcut, platform) === null;
  const dictationIsDefault = dictationBindingsEqual(
    normalizedDictation,
    dictationDefault,
  );
  const actionIsDefault =
    !actionModeAvailable ||
    actionBindingsEqual(normalizedAction, actionDefault);
  const polishIsDefault =
    !polishAvailable || polishBindingsEqual(normalizedPolish, polishDefault);

  const reset = () => {
    setDictationShortcut(dictationDefault);
    setHandsFreeShortcut(null);
    if (actionModeAvailable) setActionShortcut(actionDefault);
    if (polishAvailable) setPolishShortcut(polishDefault);
    resetShortcutStatuses();
  };

  return (
    <View style={styles.container}>
      <Button
        variant="outlined"
        size="sm"
        onPress={reset}
        disabled={
          recordingBusy ||
          (dictationIsDefault &&
            actionIsDefault &&
            polishIsDefault &&
            handsFreeIsDefault)
        }
      >
        Reset to default
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
});
