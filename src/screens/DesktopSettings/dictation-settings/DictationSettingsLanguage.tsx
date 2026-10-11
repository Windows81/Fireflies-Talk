import { Select } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import {
  DICTATION_LANGUAGE_OPTIONS,
  MAX_DICTATION_LANGUAGE_HINTS,
  useDictationLanguageHints,
} from "@/features/settings";
import { createStyles } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const DictationSettingsLanguage: FC = () => {
  const { selected, autoDetect, setSelected, setAutoDetect } =
    useDictationLanguageHints();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Languages"
            description="Pick the languages you speak so dictation is more accurate."
            id="setting-label-dictation-languages"
          />
          <View style={styles.autoDetect}>
            <Text variant="body2Regular" color="textSecondary">
              Auto-detect
            </Text>
            <Switch
              value={autoDetect}
              onValueChange={setAutoDetect}
              aria-label="Auto-detect"
            />
          </View>
        </SettingRow>
        <Select
          multiple
          showSearch
          disabled={autoDetect}
          value={selected}
          onValueChange={setSelected}
          options={DICTATION_LANGUAGE_OPTIONS}
          maxSelections={MAX_DICTATION_LANGUAGE_HINTS}
          aria-labelledby="setting-label-dictation-languages"
        />
      </SettingField>
    </SettingsGroup>
  );
};

const styles = createStyles({
  autoDetect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
