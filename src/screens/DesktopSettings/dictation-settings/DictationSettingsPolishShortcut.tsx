import { useLocalSettings } from "@/features/settings";
import { IconSparkles } from "@/assets/svg/svgs.gen";
import { useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import { normalizeActionBinding } from "electron/src/dictation/action-binding";
import { normalizeDictationBinding } from "electron/src/dictation/dictation-binding";
import { normalizeHandsFreeBinding } from "electron/src/dictation/hands-free-binding";
import {
  normalizePolishBinding,
  POLISH_SHARED_KEY_ERROR,
  polishSharesKey,
  validatePolishCapture,
} from "electron/src/dictation/polish-binding";
import { getDictationBindingKeycaps } from "electron/src/dictation/shortcut-keys";
import { type FC, useEffect } from "react";
import { DictationShortcutRow } from "./DictationShortcutRow";
import { useShortcutRecorder } from "./useShortcutRecorder";

export const DictationSettingsPolishShortcut: FC = () => {
  const theme = useTheme();
  const {
    actionShortcut,
    dictationShortcut,
    handsFreeShortcut,
    polishShortcut,
    setPolishShortcut,
  } = useLocalSettings();

  const platform = getActualPlatform();
  const binding = normalizePolishBinding(polishShortcut, platform);
  const dictationBinding = normalizeDictationBinding(
    dictationShortcut,
    platform,
  );
  const actionBinding = normalizeActionBinding(actionShortcut, platform);
  const handsFreeBinding = normalizeHandsFreeBinding(
    handsFreeShortcut,
    platform,
  );

  useEffect(() => {
    void window.electron?.dictation?.setPolishShortcut?.(
      normalizePolishBinding(polishShortcut, platform),
    );
  }, [polishShortcut, platform]);

  const {
    cancel,
    clearStatus,
    isLocked,
    isRecording,
    progressKeycaps,
    record,
    status,
  } = useShortcutRecorder({
    conflicts: [
      { binding: dictationBinding, role: "dictation" },
      { binding: actionBinding, role: "action" },
      { binding: handsFreeBinding, role: "handsFree" },
    ],
    onCaptured: (next) =>
      setPolishShortcut(normalizePolishBinding(next, platform)),
    validateBinding: (next) =>
      validatePolishCapture(next) ??
      ([dictationBinding, actionBinding, handsFreeBinding].some((other) =>
        polishSharesKey(next, other),
      )
        ? POLISH_SHARED_KEY_ERROR
        : null),
  });

  const clearPolishShortcut = () => {
    clearStatus();
    setPolishShortcut(null);
  };

  return (
    <DictationShortcutRow
      addLabel="Add a shortcut"
      icon={
        <IconSparkles width={20} height={20} color={theme.colors.textMuted} />
      }
      title="Polish shortcut"
      description="Select some text, then press this to rewrite it in place."
      hint="Fn and a key, or a combination like Ctrl + Shift + P."
      id="setting-label-polish-shortcut"
      isLocked={isLocked}
      isRecording={isRecording}
      keycaps={
        binding ? getDictationBindingKeycaps(binding, { isMac: true }) : []
      }
      onCancel={cancel}
      onRecord={record}
      onClear={binding ? clearPolishShortcut : undefined}
      prefix="Press"
      progressKeycaps={progressKeycaps}
      status={status}
    />
  );
};
