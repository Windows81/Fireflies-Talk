import {
  formatDictationBindingLabel,
  normalizeDictationBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";

/** Same label Settings and the change-shortcut modal show for this binding. */
export function onboardingShortcutLabel(
  binding: DictationBinding,
  platform: string,
): string {
  const isMac = platform === "darwin";

  return formatDictationBindingLabel(
    normalizeDictationBinding(binding, platform),
    { isMac },
  );
}

export function shortcutDictateHint(label: string): string {
  return `Press ${label} on any app to start dictating`;
}

export function handsFreeSubtitle(label: string): string {
  return `For longer thoughts, you don't need to keep holding ${label}`;
}
