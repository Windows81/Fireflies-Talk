import { Switch } from "@/components/Switch";
import { type FC, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SettingLabel, SettingRow } from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";

/** Child row of the Floating pill setting; only meaningful while the pill is shown. */
export const DictationSettingsMinimizePill: FC = () => {
  const { minimizeDictationPill, setMinimizeDictationPill } =
    useLocalSettings();

  // A store rehydrated from before this setting existed has no value for it.
  // Sending that through as-is would read in the main process as "not
  // minimized" and silently change the pill's shape just for opening this tab.
  useEffect(() => {
    window.electron?.dictation?.setPillMinimized?.(
      minimizeDictationPill !== false,
    );
  }, [minimizeDictationPill]);

  const checked = minimizeDictationPill !== false;

  return (
    <View style={styles.child}>
      <SettingRow>
        <SettingLabel
          title="Minimize pill"
          description="Keep the pill as a slim nub until you point at it. Turn this off to rest it as a pill showing the Fireflies mark."
          id="setting-label-dictation-minimize-pill"
        />
        <Switch
          value={checked}
          onValueChange={setMinimizeDictationPill}
          aria-labelledby="setting-label-dictation-minimize-pill"
        />
      </SettingRow>
    </View>
  );
};

const styles = StyleSheet.create({
  child: {
    paddingLeft: 16,
  },
});
