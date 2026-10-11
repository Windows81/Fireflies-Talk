import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { useLocalSettings } from "@/features/settings";
import { useTheme } from "@/styles";
import { shortcutModifierKeys } from "@/utils/keyboard-shortcuts";
import { type FC, useEffect } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SettingLabel, SettingRow } from "../components/SettingsForm";

const Keycap: FC<{ label: string }> = ({ label }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.keycap,
        {
          backgroundColor: theme.colors.interactiveSecondaryDefault,
          borderColor: theme.colors.borderStaticSubtle,
        },
      ]}
    >
      <Text variant="body3Weight" color="textSecondary">
        {label}
      </Text>
    </View>
  );
};

const ShortcutDisplay: FC<{
  value: string;
  disabled: boolean;
  onChange: (key: string) => void;
}> = ({ value, disabled, onChange }) => {
  const theme = useTheme();

  return (
    <View style={[styles.combo, disabled && styles.comboDisabled]}>
      {shortcutModifierKeys.map((key) => (
        <Keycap key={key} label={key} />
      ))}
      <TextInput
        value={value}
        editable={!disabled}
        onChangeText={(text) => {
          const letter = text
            .replace(/[^a-zA-Z]/g, "")
            .slice(-1)
            .toUpperCase();
          if (letter) onChange(letter);
        }}
        maxLength={2}
        selectTextOnFocus
        style={[
          styles.keycap,
          styles.editableKey,
          {
            backgroundColor: theme.colors.interactiveSecondaryDefault,
            borderColor: theme.colors.borderInteractiveDefault,
            color: theme.colors.textSecondary,
            outlineStyle: "none",
          } as object,
        ]}
      />
    </View>
  );
};

export const PreferenceSettingsGlobalShortcuts: FC = () => {
  const {
    quickNoteShortcutEnabled,
    quickNoteShortcutKey,
    setQuickNoteShortcutEnabled,
    setQuickNoteShortcutKey,
  } = useLocalSettings();

  useEffect(() => {
    window.electron?.app
      ?.setQuickNoteShortcut?.(quickNoteShortcutEnabled, quickNoteShortcutKey)
      ?.catch(console.error);
  }, [quickNoteShortcutEnabled, quickNoteShortcutKey]);

  return (
    <View style={styles.container}>
      <SettingRow>
        <SettingLabel
          id="setting-label-quick-note-enabled"
          title="Take Notes Shortcut"
          description="Enable or disable the global shortcut for quick notes."
        />
        <Switch
          value={quickNoteShortcutEnabled}
          onValueChange={setQuickNoteShortcutEnabled}
          aria-labelledby="setting-label-quick-note-enabled"
        />
      </SettingRow>

      <SettingRow>
        <SettingLabel
          id="setting-label-quick-note-key"
          title="Shortcut Key"
          description="Customize the key used to start a quick note."
        />
        <ShortcutDisplay
          value={quickNoteShortcutKey}
          disabled={!quickNoteShortcutEnabled}
          onChange={setQuickNoteShortcutKey}
        />
      </SettingRow>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 20,
  },
  combo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comboDisabled: {
    opacity: 0.4,
  },
  keycap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  editableKey: {
    minWidth: 32,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
  },
});
