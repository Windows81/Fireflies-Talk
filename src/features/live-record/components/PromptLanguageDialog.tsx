import { IconGlobe, IconInfo } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Select } from "@/components/Input";
import { Text } from "@/components/Typography";
import { useLanguageOptions } from "@/features/language";
import { useRecordPreferencesStore } from "../record-preference.store";
import { setLocalUserFlag } from "@/features/user-flags";
import { useTheme } from "@/styles";
import { useCallback, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StartInputs } from "../RecordActionsContext";
import { BottomSheet } from "@/components/BottomSheet";

export const PromptLanguageDialog: FC<{
  isOpen: boolean;
  close: () => void;
  startInputs: StartInputs;
  startRecording: (inputs: StartInputs) => Promise<void>;
}> = ({ isOpen, close, startInputs, startRecording }) => {
  const { language, setLanguage } = useRecordPreferencesStore();
  const [rememberLanguage, setRememberLanguage] = useState<boolean>(false);
  const languageOptions = useLanguageOptions();

  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const closeDialog = useCallback(() => {
    close();
    setLocalUserFlag("record.language-select-prompt.shown", false);
  }, [close]);

  return (
    <BottomSheet.Root isOpen={isOpen} close={close}>
      <BottomSheet.View
        style={[
          styles.container,
          { paddingBottom: safeAreaInsets.bottom || 24 },
        ]}
      >
        <Text
          variant={"title1Weight"}
          color={"textSecondary"}
          style={styles.title}
        >
          Meeting Language
        </Text>
        <Select
          value={language}
          Icon={IconGlobe}
          onValueChange={setLanguage}
          options={languageOptions}
          aria-label="Select recording language"
          showSearch
          presentation="sheet"
        />
        <View style={styles.footnote}>
          <IconInfo
            width={16}
            height={16}
            color={theme.colors.textHint}
            style={styles.infoIcon}
          />
          <Text
            style={styles.footnoteText}
            variant="body2Regular"
            color="textHint"
          >
            You can still change it from the menu while recording.
          </Text>
        </View>
        <Checkbox
          value={rememberLanguage}
          onValueChange={setRememberLanguage}
          label="Remember my choice"
        />
        <View style={styles.actions}>
          <Button
            style={styles.action}
            variant="outlined"
            onPress={closeDialog}
          >
            Cancel
          </Button>
          <Button
            style={styles.action}
            onPress={() => {
              close();
              startRecording({
                ...startInputs,
                language,
                skipLanguagePrompt: true,
              });
              setLocalUserFlag(
                "record.language-select-prompt.shown",
                rememberLanguage,
              );
            }}
          >
            Start Recording
          </Button>
        </View>
      </BottomSheet.View>
    </BottomSheet.Root>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  title: {
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  footnote: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  footnoteText: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 28,
    marginBottom: 16,
  },
  action: {
    flex: 1,
  },
  infoIcon: {
    marginTop: 3,
  },
});
