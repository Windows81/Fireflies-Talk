import { IconSearch } from "@/assets/svg";
import { SelectItem, TextInput, type SelectOption } from "@/components/Input";
import { ITEM_HEIGHT } from "../../../../components/Input/selectConstants";
import {
  keyFromKeyboardEvent,
  selectKeyboardAction,
} from "../../../../components/Input/selectKeyboard";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { createStyles, vars } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { matchSorter } from "match-sorter";
import { useEffect, useId, useMemo, useRef, useState, type FC } from "react";
import { ScrollView, View } from "react-native";

interface LanguageDropdownProps {
  /** Applied to the option list, which the field's `aria-controls` targets. */
  id: string;
  options: readonly SelectOption<string>[];
  selected: string[];
  autoDetect: boolean;
  /** Only offered to users who already dictate with auto-detect on. */
  showAutoDetect: boolean;
  onToggleLanguage: (code: string) => void;
  onAutoDetectChange: (enabled: boolean) => void;
  onClose: () => void;
}

interface KeyEvent {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
}

/** Rows above the highlighted one kept in view while stepping with the arrows. */
const SCROLL_LEAD_ROWS = 2;

export const LanguageDropdown: FC<LanguageDropdownProps> = ({
  id,
  options,
  selected,
  autoDetect,
  showAutoDetect,
  onToggleLanguage,
  onAutoDetectChange,
  onClose,
}) => {
  const optionIdBase = useId();
  const listRef = useRef<ScrollView>(null);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const query = search.trim();

  const matches = useMemo(() => {
    if (!query) return options;
    return matchSorter(options, query, { keys: ["value", "label", "alt"] });
  }, [options, query]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setHighlightedIndex(0);
  };

  // The list is a plain ScrollView, so it has to be told to keep up with the
  // highlight; rows are fixed-height, which makes the offset a multiplication.
  useEffect(() => {
    const row = Math.max(0, highlightedIndex - SCROLL_LEAD_ROWS);
    listRef.current?.scrollTo({ y: row * ITEM_HEIGHT, animated: false });
  }, [highlightedIndex]);

  const handleKeyDown = (event: KeyEvent) => {
    const action = selectKeyboardAction(
      keyFromKeyboardEvent(event),
      highlightedIndex,
      matches.length,
    );
    if (action.type === "none") return;
    event.preventDefault?.();

    if (action.type === "highlight") {
      setHighlightedIndex(action.index);
    } else if (action.type === "select") {
      const option = matches[highlightedIndex];
      if (option) onToggleLanguage(option.value);
    } else {
      onClose();
    }
  };

  const highlightedOptionId =
    matches.length > 0 ? `${optionIdBase}-${highlightedIndex}` : undefined;

  return (
    <View style={styles.dropdown}>
      {showAutoDetect && (
        <View style={styles.autoDetectCard}>
          <View style={styles.autoDetectText}>
            <Text variant="body2Regular" color="textSecondary">
              Auto-detect language
            </Text>
            <Text variant="body3Regular" color="textHint">
              Dictate across different languages
            </Text>
          </View>
          <Switch
            variant="desktop"
            value={autoDetect}
            onValueChange={onAutoDetectChange}
            aria-label="Auto-detect language"
          />
        </View>
      )}

      {/* The search field owns the keyboard for the whole list: it takes focus
          as the list opens, so typing filters and the arrows move the highlight
          without a second focus stop. On web, onKeyPress fires from keydown for
          every key, arrows included. */}
      <View style={styles.search}>
        <TextInput
          autoFocus
          placeholder="Search"
          value={search}
          onValueChange={handleSearchChange}
          onKeyPress={handleKeyDown}
          Icon={IconSearch}
          variant="inlined"
          aria-label="Search languages"
          aria-controls={id}
          aria-activedescendant={highlightedOptionId}
        />
      </View>

      <ScrollView
        ref={listRef}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        persistentScrollbar
      >
        {/* Only the options belong in the listbox, so the id the combobox
            targets sits here and not on the panel with the switch and search. */}
        <View
          nativeID={id}
          // @ts-expect-error: RN's Role union has no "listbox"
          role="listbox"
          aria-label="Languages"
          aria-multiselectable
        >
          {matches.map((option, index) => (
            <SelectItem
              key={option.value}
              option={option}
              nativeID={`${optionIdBase}-${index}`}
              showCheckbox
              surfaceColor={DESKTOP_THEME.grey1010}
              selected={selected.includes(option.value)}
              highlighted={index === highlightedIndex}
              onPress={() => onToggleLanguage(option.value)}
            />
          ))}
        </View>
        {matches.length === 0 && (
          <Text
            variant="body2Regular"
            color="textHint"
            style={styles.emptyState}
          >
            No languages match “{query}”
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = createStyles({
  // The onboarding overlay runs on the translucent desktop theme, so the panel
  // takes its surfaces from the solid palette instead — otherwise the card
  // behind it shows through the list.
  dropdown: {
    position: "absolute" as const,
    top: "100%" as const,
    left: 0,
    right: 0,
    marginTop: 8,
    maxHeight: 307,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    borderRadius: 8,
    overflow: "hidden" as const,
    zIndex: 30,
    ...vars.elevations[3],
  },
  autoDetectCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: DESKTOP_THEME.grey950,
    borderRadius: 8,
  },
  autoDetectText: {
    flex: 1,
    gap: 2,
  },
  search: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: DESKTOP_THEME.grey900,
  },
  list: {
    flexGrow: 0,
  },
  emptyState: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});
