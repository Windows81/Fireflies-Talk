import { useLocalSettings } from "@/features/settings";
import { useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import {
  actionRunsAsShiftOverlay,
  normalizeActionBinding,
  validateActionCapture,
} from "electron/src/dictation/action-binding";
import {
  isFnShiftBinding,
  normalizeDictationBinding,
} from "electron/src/dictation/dictation-binding";
import {
  HANDS_FREE_DICTATION_SHARED_KEY_ERROR,
  handsFreeOverlaps,
  normalizeHandsFreeBinding,
} from "electron/src/dictation/hands-free-binding";
import {
  normalizePolishBinding,
  polishSharesKey,
  SHARES_POLISH_KEY_ERROR,
} from "electron/src/dictation/polish-binding";
import { getDictationBindingKeycaps } from "electron/src/dictation/shortcut-keys";
import { IconZap } from "@/assets/svg/svgs.gen";
import { type FC, useEffect } from "react";
import { DictationShortcutRow } from "./DictationShortcutRow";
import { useShortcutRecorder } from "./useShortcutRecorder";

export const DictationSettingsActionShortcut: FC = () => {
  const {
    actionShortcut,
    dictationActionModeEnabled,
    dictationShortcut,
    handsFreeShortcut,
    polishShortcut,
    setActionShortcut,
  } = useLocalSettings();

  const platform = getActualPlatform();
  const isMac = platform === "darwin";
  const binding = normalizeActionBinding(actionShortcut, platform);
  const dictationBinding = normalizeDictationBinding(
    dictationShortcut,
    platform,
  );
  const handsFreeBinding = normalizeHandsFreeBinding(
    handsFreeShortcut,
    platform,
  );
  const polishBinding = normalizePolishBinding(polishShortcut, platform);
  // Fn + Shift is read during the Fn hold, so it needs Fn to be the dictation
  // shortcut. Anything else leaves it with no hold to attach to.
  const fnShiftStranded =
    isFnShiftBinding(binding) &&
    !actionRunsAsShiftOverlay(binding, dictationBinding);

  useEffect(() => {
    void window.electron?.dictation?.setActionShortcut?.(
      normalizeActionBinding(actionShortcut, platform),
    );
  }, [actionShortcut, platform]);

  const conflicts = [
    { binding: dictationBinding, role: "dictation" as const },
    { binding: handsFreeBinding, role: "handsFree" as const },
    { binding: polishBinding, role: "polish" as const },
  ];

  const theme = useTheme();
  const { cancel, isLocked, isRecording, progressKeycaps, record, status } =
    useShortcutRecorder({
      conflicts,
      onCaptured: setActionShortcut,
      // One native listener watches Fn and it drives the dictation hold, so the
      // only Fn shortcut action mode can take is Fn + Shift.
      validateBinding: (next) => {
        const error = validateActionCapture(next, platform);
        if (error) return error;
        if (polishSharesKey(polishBinding, next))
          return SHARES_POLISH_KEY_ERROR;
        return handsFreeOverlaps(next, handsFreeBinding)
          ? HANDS_FREE_DICTATION_SHARED_KEY_ERROR
          : null;
      },
    });

  return (
    <DictationShortcutRow
      icon={<IconZap width={20} height={20} color={theme.colors.textMuted} />}
      title="Action mode shortcut"
      description="Hold this to send a command to Fred. Double-tap to keep going without holding."
      disabled={!dictationActionModeEnabled}
      hint={
        fnShiftStranded
          ? "Fn + Shift only works while your push to talk shortcut is Fn. Change one of them."
          : dictationActionModeEnabled
            ? isMac
              ? "A combination like Fn + Shift, or a side mouse button."
              : "A combination like Ctrl + Win + Shift, or a side mouse button."
            : "Turn on Action mode in Preferences to use this shortcut."
      }
      id="setting-label-action-shortcut"
      isLocked={isLocked}
      isRecording={isRecording}
      keycaps={binding ? getDictationBindingKeycaps(binding, { isMac }) : []}
      onCancel={cancel}
      onRecord={record}
      prefix="Hold"
      progressKeycaps={progressKeycaps}
      status={status}
    />
  );
};
