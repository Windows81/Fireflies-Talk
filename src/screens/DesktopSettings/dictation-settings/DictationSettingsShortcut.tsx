import {
  useIsTalkActionModeFlagOn,
  useLocalSettings,
} from "@/features/settings";
import { useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import { normalizeActionBinding } from "electron/src/dictation/action-binding";
import {
  isFnShiftBinding,
  normalizeDictationBinding,
} from "electron/src/dictation/dictation-binding";
import {
  HANDS_FREE_DICTATION_SHARED_KEY_ERROR,
  handsFreeFnTaken,
  handsFreeOverlaps,
  normalizeHandsFreeBinding,
} from "electron/src/dictation/hands-free-binding";
import {
  normalizePolishBinding,
  polishSharesKey,
  SHARES_POLISH_KEY_ERROR,
} from "electron/src/dictation/polish-binding";
import { getDictationBindingKeycaps } from "electron/src/dictation/shortcut-keys";
import { PushToTalkIcon } from "./ShortcutModeIcons";
import { dictationShortcutHint } from "./captureDictationShortcutHelpers";
import { type FC, useEffect } from "react";
import { DictationShortcutRow } from "./DictationShortcutRow";
import { useShortcutRecorder } from "./useShortcutRecorder";

export const DictationSettingsShortcut: FC = () => {
  const theme = useTheme();
  const {
    dictationShortcut,
    actionShortcut,
    handsFreeShortcut,
    polishShortcut,
    setDictationShortcut,
  } = useLocalSettings();
  const actionModeAvailable = useIsTalkActionModeFlagOn();

  const platform = getActualPlatform();
  const isMac = platform === "darwin";
  const binding = normalizeDictationBinding(dictationShortcut, platform);
  const actionBinding = normalizeActionBinding(actionShortcut, platform);
  const handsFreeBinding = normalizeHandsFreeBinding(
    handsFreeShortcut,
    platform,
  );
  const polishBinding = normalizePolishBinding(polishShortcut, platform);

  useEffect(() => {
    void window.electron?.dictation?.setShortcut?.(
      normalizeDictationBinding(dictationShortcut, platform),
    );
  }, [dictationShortcut, platform]);

  const conflicts = [
    {
      binding: actionBinding,
      message: actionModeAvailable
        ? undefined
        : "That shortcut is reserved. Pick something else to dictate with.",
      role: "action" as const,
    },
    { binding: polishBinding, role: "polish" as const },
    { binding: handsFreeBinding, role: "handsFree" as const },
  ];

  const { cancel, isLocked, isRecording, progressKeycaps, record, status } =
    useShortcutRecorder({
      allowBareFn: true,
      conflicts,
      onCaptured: setDictationShortcut,
      validateBinding: (next) => {
        if (isFnShiftBinding(next)) {
          return actionModeAvailable
            ? "Fn + Shift starts action mode. Pick something else to dictate with."
            : "Fn + Shift is reserved. Pick something else to dictate with.";
        }
        if (polishSharesKey(polishBinding, next))
          return SHARES_POLISH_KEY_ERROR;
        return handsFreeOverlaps(next, handsFreeBinding) ||
          handsFreeFnTaken(handsFreeBinding, next)
          ? HANDS_FREE_DICTATION_SHARED_KEY_ERROR
          : null;
      },
    });

  return (
    <DictationShortcutRow
      icon={<PushToTalkIcon color={theme.colors.textMuted} />}
      title="Push to talk"
      description="Hold hotkey to dictate something short"
      hint={dictationShortcutHint(isMac)}
      id="setting-label-dictation-shortcut"
      isLocked={isLocked}
      isRecording={isRecording}
      keycaps={getDictationBindingKeycaps(binding, { isMac })}
      onCancel={cancel}
      onRecord={record}
      prefix="Hold"
      progressKeycaps={progressKeycaps}
      status={status}
    />
  );
};
