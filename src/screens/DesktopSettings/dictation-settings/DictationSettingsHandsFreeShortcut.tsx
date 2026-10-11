import {
  useIsTalkActionModeFlagOn,
  useLocalSettings,
} from "@/features/settings";
import { useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import {
  HANDS_FREE_SHARED_KEY_ERROR,
  handsFreeBindingFromCapture,
  handsFreeSharesKey,
  normalizeHandsFreeBinding,
  validateHandsFreeCapture,
} from "electron/src/dictation/hands-free-binding";
import {
  normalizeDictationBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import { normalizeActionBinding } from "electron/src/dictation/action-binding";
import {
  normalizePolishBinding,
  polishSharesKey,
  SHARES_POLISH_KEY_ERROR,
} from "electron/src/dictation/polish-binding";
import { getDictationBindingKeycaps } from "electron/src/dictation/shortcut-keys";
import { dictationShortcutHint } from "./captureDictationShortcutHelpers";
import { HandsFreeIcon } from "./ShortcutModeIcons";
import { type FC, useEffect } from "react";
import { DictationShortcutRow } from "./DictationShortcutRow";
import { useShortcutRecorder } from "./useShortcutRecorder";

export const DictationSettingsHandsFreeShortcut: FC = () => {
  const theme = useTheme();
  const {
    actionShortcut,
    dictationShortcut,
    handsFreeShortcut,
    polishShortcut,
    setHandsFreeShortcut,
  } = useLocalSettings();
  const actionModeAvailable = useIsTalkActionModeFlagOn();
  const platform = getActualPlatform();
  const isMac = platform === "darwin";
  const binding = normalizeHandsFreeBinding(handsFreeShortcut, platform);
  const dictationBinding = normalizeDictationBinding(
    dictationShortcut,
    platform,
  );
  const actionBinding = normalizeActionBinding(actionShortcut, platform);
  const polishBinding = normalizePolishBinding(polishShortcut, platform);

  useEffect(() => {
    void window.electron?.dictation?.setHandsFreeShortcut?.(
      normalizeHandsFreeBinding(handsFreeShortcut, platform),
    );
  }, [handsFreeShortcut, platform]);

  const conflicts = [
    { binding: dictationBinding, role: "dictation" as const },
    {
      binding: actionBinding,
      message: actionModeAvailable
        ? undefined
        : "That shortcut is reserved. Pick something else.",
      role: "action" as const,
    },
    { binding: polishBinding, role: "polish" as const },
  ];

  const {
    cancel,
    clearStatus,
    isLocked,
    isRecording,
    progressKeycaps,
    record,
    status,
  } = useShortcutRecorder({
    allowBareFn: true,
    conflicts,
    fromCapture: handsFreeBindingFromCapture,
    onCaptured: setHandsFreeShortcut,
    validateBinding: (next: DictationBinding) =>
      validateHandsFreeCapture(next, platform, dictationBinding) ??
      (handsFreeSharesKey(next, dictationBinding, actionBinding)
        ? HANDS_FREE_SHARED_KEY_ERROR
        : null) ??
      (polishSharesKey(polishBinding, next) ? SHARES_POLISH_KEY_ERROR : null),
  });

  const clearHandsFreeShortcut = () => {
    clearStatus();
    setHandsFreeShortcut(null);
  };

  return (
    <DictationShortcutRow
      icon={<HandsFreeIcon color={theme.colors.textMuted} />}
      title="Hands-free mode"
      description="Double-tap the hotkey, or use your own shortcut"
      hint={dictationShortcutHint(isMac)}
      id="setting-label-hands-free-shortcut"
      isLocked={isLocked}
      isRecording={isRecording}
      fixedItem={{
        prefix: "Double-tap",
        keycaps: getDictationBindingKeycaps(dictationBinding, { isMac }),
      }}
      keycaps={binding ? getDictationBindingKeycaps(binding, { isMac }) : []}
      onCancel={cancel}
      onClear={binding ? clearHandsFreeShortcut : undefined}
      onRecord={record}
      progressKeycaps={progressKeycaps}
      prefix="or press"
      status={status}
    />
  );
};
