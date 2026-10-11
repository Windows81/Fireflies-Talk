import { IconSearch } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { FlashListCompat } from "../FlashListCompat";
import {
  BottomSheetTextInput,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { matchSorter } from "match-sorter";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  DimensionValue,
  TextInput as RNTextInput,
  ScrollViewProps,
} from "react-native";
import { Platform, View } from "react-native";
import type { CoreSelectProps, SelectOption } from "./Select";
import { SelectItem } from "./SelectItem";
import { ITEM_HEIGHT } from "./selectConstants";
import { keyFromKeyboardEvent, selectKeyboardAction } from "./selectKeyboard";
import { TextInput } from "./TextInput";

export function SelectPopoverContent<TValue>({
  options,
  value,
  onValueChange,
  close,
  showSearch,
  freeSolo,
  selectedValues,
  closeOnSelect,
  showCheckbox,
  presentation,
  maxListHeight,
  listPaddingBottom,
}: CoreSelectProps<TValue> & {
  close: () => void;
  maxListHeight?: DimensionValue | undefined;
  listPaddingBottom?: number;
}) {
  const theme = useTheme();
  const listId = useId();
  const searchRef = useRef<RNTextInput>(null);
  const containerRef = useRef<View>(null);
  const listRef = useRef<{
    scrollToOffset: (opts: { offset: number; animated?: boolean }) => void;
  }>(null);
  const height =
    Platform.OS !== "web" ? options.length * ITEM_HEIGHT : undefined;
  const [search, setSearch] = useState("");
  const isSheet = presentation === "sheet";
  // Native sheets skip autofocus so the keyboard does not cover the list on open.
  // Web and desktop have no on-screen keyboard, so search still takes focus there.
  const shouldFocusSearch = showSearch && (!isSheet || Platform.OS === "web");
  const BottomSheetScrollable =
    useBottomSheetScrollableCreator<ScrollViewProps>();

  const filterOptions = useMemo<SelectOption<TValue>[]>(() => {
    const trimmedSearch = search.trim();
    const nonEmptyOptions = options.filter((option) => !!option.value);
    const result = trimmedSearch
      ? matchSorter(nonEmptyOptions, trimmedSearch, {
          keys: ["value", "label", "alt"],
        })
      : options;

    if (
      freeSolo &&
      !result.find(
        (option) =>
          option.label === trimmedSearch ||
          option.value === trimmedSearch ||
          option.alt?.includes(trimmedSearch),
      )
    ) {
      return [
        ...result,
        {
          label: `"${trimmedSearch}"`,
          value: trimmedSearch as TValue,
        },
      ];
    }

    return result;
  }, [freeSolo, options, search]);

  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    if (selectedValues?.length) {
      const selectedIndex = options.findIndex((option) =>
        selectedValues.includes(option.value),
      );
      return selectedIndex === -1 ? 0 : selectedIndex;
    }
    const currentIndex = options.findIndex((option) => option.value === value);
    return currentIndex === -1 ? 0 : currentIndex;
  });
  const skipSearchHighlightReset = useRef(true);

  // Keep the selected-option highlight on first open. After the user types,
  // jump back to the top of the filtered list.
  useEffect(() => {
    if (skipSearchHighlightReset.current) {
      skipSearchHighlightReset.current = false;
      return;
    }
    setHighlightedIndex(0);
  }, [search]);

  useEffect(() => {
    if (shouldFocusSearch) {
      const focusSearch = () => searchRef.current?.focus();
      focusSearch();
      const frame = requestAnimationFrame(focusSearch);
      return () => cancelAnimationFrame(frame);
    }
    const node = containerRef.current as unknown as { focus?: () => void };
    node.focus?.();
  }, [shouldFocusSearch]);

  useEffect(() => {
    if (filterOptions.length === 0) return;
    listRef.current?.scrollToOffset({
      offset: highlightedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [filterOptions.length, highlightedIndex]);

  const selectOption = useCallback(
    (option: SelectOption<TValue>) => {
      if (option.disabled) return;
      onValueChange(option.value, option);
      if (closeOnSelect !== false) close();
    },
    [close, closeOnSelect, onValueChange],
  );

  const handleKeyDown = (event: {
    key?: string;
    nativeEvent?: { key?: string };
    preventDefault?: () => void;
  }) => {
    const action = selectKeyboardAction(
      keyFromKeyboardEvent(event),
      highlightedIndex,
      filterOptions.length,
    );
    switch (action.type) {
      case "highlight":
        event.preventDefault?.();
        setHighlightedIndex(action.index);
        return;
      case "select": {
        const option = filterOptions[highlightedIndex];
        if (!option) return;
        event.preventDefault?.();
        selectOption(option);
        return;
      }
      case "close":
        event.preventDefault?.();
        close();
        return;
      case "none":
        return;
      default: {
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  };

  const renderItems = useCallback(
    ({
      item: option,
      index,
    }: {
      item: SelectOption<TValue>;
      index: number;
    }) => {
      const selected = selectedValues
        ? selectedValues.includes(option.value)
        : option.value === value;
      return (
        <SelectItem
          option={option}
          selected={selected}
          highlighted={index === highlightedIndex}
          nativeID={`${listId}-option-${index}`}
          showCheckbox={showCheckbox}
          onPress={() => {
            selectOption(option);
          }}
        />
      );
    },
    [
      highlightedIndex,
      listId,
      selectOption,
      selectedValues,
      showCheckbox,
      value,
    ],
  );

  const [initialScrollIndex] = useState(() => {
    if (value) {
      const currentOptionIndex = options.findIndex(
        (option) => option.value === value,
      );
      if (currentOptionIndex !== -1) {
        return currentOptionIndex;
      }
      return 0;
    }
  });

  const stickyHeaderIndices = useMemo(() => {
    const indices: number[] = [];
    filterOptions.forEach((option, index) => {
      if (option.sticky) {
        indices.push(index);
      }
    });
    return indices;
  }, [filterOptions]);

  const highlightedOptionId =
    filterOptions.length > 0
      ? `${listId}-option-${highlightedIndex}`
      : undefined;

  // Search owns key handling while focused. The container only takes keys when
  // there is no search field, so arrows do not fire twice.
  const webKeyboardProps =
    Platform.OS === "web"
      ? showSearch
        ? { tabIndex: -1 as const }
        : { tabIndex: -1 as const, onKeyDown: handleKeyDown }
      : undefined;

  return (
    <View ref={containerRef} style={styles.root} {...webKeyboardProps}>
      {showSearch && (
        <View style={styles.search(theme)}>
          <TextInput
            ref={searchRef}
            autoFocus={shouldFocusSearch}
            placeholder="Search"
            value={search}
            onValueChange={setSearch}
            onKeyDown={Platform.OS === "web" ? handleKeyDown : undefined}
            onKeyPress={Platform.OS === "web" ? undefined : handleKeyDown}
            Icon={IconSearch}
            variant="inlined"
            InputComponent={
              isSheet
                ? (BottomSheetTextInput as unknown as typeof RNTextInput)
                : undefined
            }
            aria-label="Search"
            aria-controls={listId}
            aria-activedescendant={highlightedOptionId}
          />
        </View>
      )}
      <View style={[styles.list, { height, maxHeight: maxListHeight }]}>
        <FlashListCompat
          ref={listRef}
          initialScrollIndex={initialScrollIndex}
          data={filterOptions}
          extraData={highlightedIndex}
          renderItem={renderItems}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          // @ts-expect-error: role="listbox" not in FlatList/FlashList types but supported by RN Web
          role="listbox"
          nativeID={listId}
          aria-multiselectable={selectedValues ? true : undefined}
          persistentScrollbar
          stickyHeaderIndices={stickyHeaderIndices}
          keyboardShouldPersistTaps="handled"
          renderScrollComponent={isSheet ? BottomSheetScrollable : undefined}
          contentContainerStyle={{ paddingBottom: listPaddingBottom }}
        />
      </View>
    </View>
  );
}

const styles = createStyles({
  root: {
    flexShrink: 1,
  },
  // Shrinks to fit the dialog. A percentage max height would resolve against
  // the auto-height dialog and leave a gap under the last item.
  list: {
    flexShrink: 1,
    ...(Platform.OS === "web" && {
      maxHeight: "80vh" as DimensionValue,
      width: "100%",
    }),
  },
  search: (theme) => ({
    padding: 4,
    borderBottomColor: theme.colors.borderStaticSubtle,
    borderBottomWidth: 1,
  }),
});
