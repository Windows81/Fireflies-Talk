import { IconCheck, IconSearch } from "@/assets/svg";
import { TextInput } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { getLanguageFlag, useLanguageOptions } from "@/features/language";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { getMeetingLanguageCode } from "../../helpers/meeting";
import type { DesktopNotepadMeeting } from "../../types";
import { useRetranscribeMeeting } from "./useRetranscribeMeeting";

const MULTI_LANGUAGE_CODE = "multi";

type RowState = { pressed: boolean; hovered?: boolean };

interface NotepadLanguageMenuProps {
  meeting: DesktopNotepadMeeting;
  close: () => void;
}

export const NotepadLanguageMenu: FC<NotepadLanguageMenuProps> = ({
  meeting,
  close,
}) => {
  const theme = useTheme();
  const [search, setSearch] = useState("");

  const options = useLanguageOptions();
  const { retranscribe, loading } = useRetranscribeMeeting(meeting.id);

  const currentCode = getMeetingLanguageCode(meeting);
  const isMulti = currentCode === MULTI_LANGUAGE_CODE;

  // "Multi-language" is surfaced as the toggle, so drop it from the list.
  const languageOptions = useMemo(
    () => options.filter((option) => option.value !== MULTI_LANGUAGE_CODE),
    [options],
  );

  const query = search.trim().toLowerCase();
  const filteredOptions = query.length
    ? languageOptions.filter((option) =>
        option.label.toLowerCase().includes(query),
      )
    : languageOptions;

  const selectLanguage = (code: string, isMulti: boolean = false) => {
    if (!isMulti) close();
    if (code !== currentCode) retranscribe(code);
  };

  return (
    <View style={styles.container}>
      <View style={styles.multiWrapper}>
        <View style={styles.multiCard(theme)}>
          <View style={styles.multiText}>
            <Text variant="body2Regular" color="textSecondary">
              Multi-language
            </Text>
            <Text variant="body3Regular" color="textMuted">
              Transcribe across different languages
            </Text>
          </View>
          <Switch
            variant="desktop"
            value={isMulti}
            disabled={isMulti || loading}
            onValueChange={() => selectLanguage(MULTI_LANGUAGE_CODE, true)}
          />
        </View>
      </View>

      <View style={styles.searchContainer(theme)}>
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
      </View>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {filteredOptions.map((option) => {
          const isActive = option.value === currentCode;
          return (
            <Pressable
              key={option.value}
              onPress={() => selectLanguage(option.value)}
            >
              {({ hovered }: RowState) => (
                <View style={[styles.row, hovered && styles.rowHovered(theme)]}>
                  <Text style={styles.flag}>
                    {getLanguageFlag(option.value)}
                  </Text>
                  <Text
                    variant="body2Regular"
                    color="textSecondary"
                    numberOfLines={1}
                    style={styles.label}
                  >
                    {option.label}
                  </Text>
                  {isActive && (
                    <IconCheck
                      width={16}
                      height={16}
                      color={theme.colors.textPrimary}
                    />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = createStyles({
  container: {
    paddingTop: 8,
    gap: 12,
  },
  multiWrapper: {
    paddingHorizontal: 12,
  },
  multiCard: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: 6,
    backgroundColor: theme.colors.layerAlphaDefault,
  }),
  multiText: {
    flex: 1,
    gap: 2,
  },
  searchContainer: (theme) => ({
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStaticDefault,
  }),
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
  },
  list: {
    maxHeight: 240,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rowHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  flag: {
    fontSize: 16,
  },
  label: {
    flex: 1,
  },
});
