import { IconGlobe } from "@/assets/svg";
import { Select } from "@/components/Input";
import { Text } from "@/components/Typography";
import { useRecorder } from "../record.store";
import { useRecordPreferencesStore } from "../record-preference.store";
import { useRecordActionsContext } from "../RecordActionsContext";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import {
  useGetLanguageNameByCode,
  useLanguageOptions,
} from "@/features/language";

export const RecordLanguageSelect: FC = () => {
  const theme = useTheme();
  const recordingState = useRecorder((s) => s.status.state);
  const { startInputs, setStartInputs } = useRecordActionsContext();
  const { language: storeLanguage } = useRecordPreferencesStore();

  const languageOptions = useLanguageOptions();
  const getLanguageNameByCode = useGetLanguageNameByCode();
  const currentLanguage = storeLanguage || startInputs.language;

  if (recordingState === "inactive") {
    return (
      <Select
        value={currentLanguage}
        onValueChange={(value) => {
          useRecordPreferencesStore.getState().setLanguage(value);
          setStartInputs((prev) => ({
            ...prev,
            language: value,
          }));
        }}
        Icon={() => (
          <IconGlobe
            aria-label="Language"
            width={16}
            height={16}
            color={theme.colors.commandNeutralDefault}
          />
        )}
        options={languageOptions}
        aria-label="Select recording language"
        showSearch
        inline
      />
    );
  }

  const languageName = getLanguageNameByCode(currentLanguage);

  return (
    <View style={styles.languageRow}>
      <IconGlobe
        aria-label="Language"
        width={16}
        height={16}
        color={theme.colors.textHint}
      />
      <Text variant="body2Regular" color="textHint">
        {languageName}
      </Text>
    </View>
  );
};

export const styles = createStyles({
  languageSelect: {
    width: "100%",
  },
  languageRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
});
