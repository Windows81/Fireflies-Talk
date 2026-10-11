import { IconCheck, IconSearch } from "@/assets/svg";
import { MenuItem, MenuPopover } from "@/components/Menu";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { TextInput } from "@/components/Input";
import {
  getLanguageFlag,
  useGetLanguageNameByCode,
  useLanguageOptions,
} from "@/features/language";
import { useRecordPreferencesStore } from "@/features/live-record/record-preference.store";
import { type Meeting } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { createStyles, useTheme } from "@/styles";
import { useMutation } from "@apollo/client";
import { UpdateMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import { type FC } from "react";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { PillButton } from "../../components/PillButton";

// The pill reflects the live-record language selection (persisted preference
// store) for instant feedback, and persists each change to the active meeting
// via updateMeeting so the recording's transcription language follows.
export const LanguagePill: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();
  const [search, setSearch] = useState("");

  const language = useRecordPreferencesStore((s) => s.language);
  const setLanguage = useRecordPreferencesStore((s) => s.setLanguage);
  const getLanguageNameByCode = useGetLanguageNameByCode();
  const options = useLanguageOptions();

  const [updateMeeting] = useMutation(UpdateMeetingDocument);

  const handleSelect = (value: string) => {
    close();
    if (value === language) return;

    setLanguage(value);
    updateMeeting({ variables: { id: meeting.id, customLanguage: value } })
      .then(() =>
        toast(`Meeting language changed to '${getLanguageNameByCode(value)}'`),
      )
      .catch((error) =>
        toast({
          type: "error",
          title: "Could not change meeting language",
          message: error.message,
        }),
      );
  };

  const label = getLanguageNameByCode(language);

  const query = search.trim().toLowerCase();
  const filteredOptions = query.length
    ? options.filter((option) => option.label.toLowerCase().includes(query))
    : options;

  return (
    <>
      <PillButton
        ref={triggerRef}
        label={label}
        onPress={open}
        active={isOpen}
      />
      <MenuPopover
        isOpen={isOpen}
        close={close}
        triggerRef={triggerRef}
        width={280}
      >
        <View style={styles.searchRow}>
          <IconSearch width={16} height={16} color={theme.colors.textHint} />
          <TextInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search"
            variant="inlined"
            style={styles.searchInput}
          />
        </View>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {filteredOptions.map((option) => {
            const isActive = option.value === language;
            return (
              <MenuItem
                key={option.value}
                onPress={() => handleSelect(option.value)}
              >
                <View style={styles.optionRow}>
                  <Text variant="body2Regular" color="textSecondary">
                    {getLanguageFlag(option.value)} {option.label}
                  </Text>
                  {isActive && (
                    <IconCheck
                      width={16}
                      height={16}
                      color={theme.colors.textPrimary}
                    />
                  )}
                </View>
              </MenuItem>
            );
          })}
        </ScrollView>
      </MenuPopover>
    </>
  );
};

const styles = createStyles({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
  },
  list: {
    maxHeight: 220,
  },
  optionRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
