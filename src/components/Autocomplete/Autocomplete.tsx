import { createStyles, useTheme, vars } from "@/styles";
import { Portal } from "@gorhom/portal";
import type { FC, ReactElement, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LayoutRectangle,
  ListRenderItem,
  TextInputProps,
} from "react-native";
import {
  InteractionManager,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  type TextInput,
} from "react-native";
import Animated from "react-native-reanimated";

export interface AutocompleteProps<ItemT = string> {
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing: (event: { nativeEvent: { text: string } }) => void;

  renderInput: (
    props: Pick<
      TextInputProps,
      "value" | "onChangeText" | "onFocus" | "onBlur" | "onSubmitEditing"
    > & { ref: RefObject<TextInput | null> },
    containerRef: RefObject<View | null>,
  ) => ReactNode;

  options: ItemT[];
  renderOption: (props: {
    item: ItemT;
    index: number;
    onPress: () => void;
  }) => ReactElement | null;

  onOptionSelect?: (item: ItemT) => void;

  portalHostname?: string;

  height: number;
}

export const Autocomplete: FC<AutocompleteProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  renderInput,
  options,
  renderOption,
  portalHostname,
  height,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const [inputLayout, setInputLayout] = useState<LayoutRectangle | null>(null);

  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);

  const textInputRef = useRef<TextInput | null>(null);

  // optional ref, if not defined, textInputRef will be used
  const containerRef = useRef<View | null>(null);

  const updatePosition = useCallback(() => {
    const container = containerRef.current || textInputRef.current;
    if (!container) {
      return;
    }
    requestAnimationFrame(() => {
      container.measureInWindow((x, y, width, height) => {
        setInputLayout({
          x,
          y,
          width,
          height,
        });
      });
    });
  }, []);

  const cancelRef = useRef<(() => void) | undefined>(undefined);
  const updateFilteredOptions = useCallback(
    (newValue: string) => {
      cancelRef.current?.();
      const { cancel } = InteractionManager.runAfterInteractions(() => {
        cancelRef.current = undefined;
        const cleanedValue = newValue.trim().toLowerCase();
        if (!cleanedValue) {
          setFilteredOptions(options);
          return;
        }
        setFilteredOptions(
          options.filter((option) =>
            option.toLowerCase().includes(cleanedValue),
          ),
        );
      });
      cancelRef.current = cancel;
    },
    [options],
  );

  const selectOption = useCallback(
    (option: string) => {
      onChangeText(option);
      textInputRef.current?.blur();
      onSubmitEditing({ nativeEvent: { text: option } });
    },
    [onChangeText, onSubmitEditing],
  );

  const renderItem = useCallback<ListRenderItem<string>>(
    ({ item, index }) => {
      return renderOption({ item, index, onPress: () => selectOption(item) });
    },
    [renderOption, selectOption],
  );

  const onTextInputValueChange = useCallback(
    (text: string) => {
      onChangeText(text);
      setIsVisible(true);
      updateFilteredOptions(text);
    },
    [updateFilteredOptions, onChangeText],
  );

  const onTextInputBlur = useCallback<
    NonNullable<TextInputProps["onBlur"]>
  >(() => {
    setIsVisible(false);
  }, []);

  const onTextInputFocus = useCallback(() => {
    updatePosition();
    updateFilteredOptions(value);
    setIsVisible(true);
  }, [updatePosition, updateFilteredOptions, value]);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      "keyboardDidShow",
      updatePosition,
    );
    const hideListener = Keyboard.addListener(
      "keyboardDidHide",
      updatePosition,
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [updatePosition]);

  const theme = useTheme();

  return (
    <>
      {renderInput(
        {
          ref: textInputRef,
          value,
          onChangeText: onTextInputValueChange,
          onBlur: onTextInputBlur,
          onFocus: onTextInputFocus,
          onSubmitEditing: (event) => selectOption(event.nativeEvent.text),
        },
        containerRef,
      )}
      <Portal hostName={portalHostname}>
        {inputLayout && isVisible && !!filteredOptions?.length && (
          <>
            <Pressable
              style={styles.dismisser}
              onPress={() => setIsVisible(false)}
            />
            <View
              style={[
                styles.root(theme),
                {
                  width: inputLayout.width,
                  maxHeight: height,
                  left: inputLayout.x,
                  top: inputLayout.y + inputLayout.height + 12,
                },
              ]}
            >
              <Animated.FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={filteredOptions}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </>
        )}
      </Portal>
    </>
  );
};

const styles = createStyles({
  root: (theme) => ({
    position: "absolute",
    backgroundColor: theme.colors.layerDefault,
    borderColor: theme.colors.borderStaticDefault,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
    ...vars.elevations[1],
  }),
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  dismisser: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
});
