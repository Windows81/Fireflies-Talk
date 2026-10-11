import { useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useCallback, useMemo, useRef, useState, type FC } from "react";
import type {
  AccessibilityProps,
  DimensionValue,
  LayoutChangeEvent,
  StyleProp,
  TextInputKeyPressEventData,
  ViewStyle,
} from "react-native";
import {
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Dialog } from "../Dialog";
import type { TagProps } from "../Tag";
import { Tag } from "../Tag";
import { styles } from "./Input.styles";
import type { InputProps, UsuableRNTexInputProps } from "./TextInput";

export interface TagInputProps extends UsuableRNTexInputProps {
  value: string[];
  onChangeValue: (
    value: string[],
    option: string,
    action: "add" | "remove",
  ) => void | boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: InputProps["variant"];
  maxTagVisible?: number;
  renderTag?: (props: TagProps & { key?: string }) => React.ReactNode;
  text?: string;
  onChangeText?: (text: string) => void;
}

const TagInputDialogContent: FC<{
  value: string[];
  removeOption: (index: number) => void;
  renderTag?: (props: TagProps & { key?: string }) => React.ReactNode;
  disabled?: boolean;
}> = ({ value, removeOption, renderTag, disabled }) => {
  const [height, setHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View style={[tagInputStyles.tagInputDialogContent, { height }]}>
      <ScrollView>
        <View style={tagInputStyles.tagInputDialogInner} onLayout={onLayout}>
          {value.map((option, index) => {
            const key = `${option}/${index}`;
            const onClear = !disabled ? () => removeOption(index) : undefined;
            if (renderTag) return renderTag({ key, onClear, children: option });
            return (
              <Tag key={key} onClear={onClear}>
                {option}
              </Tag>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export const TagInput: FC<TagInputProps & AccessibilityProps> = ({
  value,
  onChangeValue,
  disabled,
  style,
  variant = "outlined",
  maxTagVisible,
  renderTag,
  text: controlledText,
  onChangeText: onChangeTextProp,
  ...props
}) => {
  const theme = useTheme();

  const inputRef = useRef<RNTextInput>(null);

  const [hover, setHoverTrue, setHoverFalse] = useBooleanState();
  const [focused, setFocusedTrue, setFocusedFalse] = useBooleanState();

  const textRef = useRef("");

  const saveOption = useCallback(() => {
    const trimmedText = textRef.current.trim();
    if (!trimmedText) return;
    const isOk = onChangeValue([...value, trimmedText], trimmedText, "add");
    if (isOk !== false) {
      textRef.current = "";
      inputRef.current?.clear();
      onChangeTextProp?.("");
    }
  }, [onChangeValue, onChangeTextProp, value]);

  const removeOption = useCallback(
    (index: number) => {
      if (index < 0) return;
      const newValue = [...value];
      newValue.splice(index, 1);
      onChangeValue(newValue, value[index], "remove");
    },
    [onChangeValue, value],
  );

  const onKeyPress = useCallback(
    ({ nativeEvent: { key } }: { nativeEvent: TextInputKeyPressEventData }) => {
      if (key === "Backspace" && !textRef.current) {
        removeOption(value.length - 1);
      }
      if (key === "Tab") {
        // need to delay or onChangeText will overrde it
        setTimeout(saveOption, 100);
      }
    },
    [removeOption, saveOption, value],
  );

  const onBlur = useCallback(() => {
    setFocusedFalse();
    saveOption();
  }, [saveOption, setFocusedFalse]);

  const [isOpenTagsModal, openTagsModal, closeTagsModal] = useBooleanState();

  const tagNodes = useMemo(() => {
    const max = maxTagVisible ?? value.length;
    const nodes: React.ReactNode[] = value
      .slice(0, max)
      .map((option, index) => {
        const key = `${option}/${index}`;
        const onClear = !disabled ? () => removeOption(index) : undefined;
        if (renderTag) return renderTag({ key, onClear, children: option });
        return (
          <Tag
            key={`${option}/${index}`}
            onClear={!disabled ? () => removeOption(index) : undefined}
          >
            {option}
          </Tag>
        );
      });
    if (value.length > max) {
      nodes.push(
        <Tag key="more" onPress={openTagsModal}>{`${
          value.length - max
        } more`}</Tag>,
      );
    }
    return nodes;
  }, [value, maxTagVisible, disabled, removeOption, openTagsModal, renderTag]);

  const onChangeText = useCallback(
    (text: string) => {
      textRef.current = text;
      onChangeTextProp?.(text);
    },
    [onChangeTextProp],
  );

  return (
    <>
      <View
        style={[
          styles.root,
          styles[variant](theme),
          styles.md,
          hover && styles[`${variant}Hover`](theme),
          focused && styles[`${variant}Focused`](theme),
          tagInputStyles.root,
          style,
        ]}
      >
        {tagNodes}
        <RNTextInput
          ref={inputRef}
          placeholderTextColor={theme.colors.textHint}
          onPointerEnter={setHoverTrue}
          onPointerLeave={setHoverFalse}
          onFocus={setFocusedTrue}
          onBlur={onBlur}
          onKeyPress={onKeyPress}
          onSubmitEditing={saveOption}
          blurOnSubmit={false}
          readOnly={disabled}
          value={controlledText}
          onChangeText={onChangeText}
          style={[
            styles.input(theme),
            disabled && styles.inputDisabled(theme),
            tagInputStyles.tagInput,
          ]}
          cursorColor={theme.colors.layerContrast}
          {...props}
        />
      </View>
      <Dialog.Root
        isOpen={isOpenTagsModal}
        variant="basic"
        close={closeTagsModal}
      >
        <TagInputDialogContent
          value={value}
          removeOption={removeOption}
          renderTag={renderTag}
          disabled={disabled}
        />
      </Dialog.Root>
    </>
  );
};

const tagInputStyles = StyleSheet.create({
  root: {
    flexWrap: "wrap",
    paddingVertical: 8,
    flexDirection: "row",
  },
  tagInput: {
    minWidth: 100,
    minHeight: 22,
    flex: 0,
    flexGrow: 1,
    padding: 0,
  },
  tagInputDialogContent: {
    maxHeight: Platform.select({
      web: "80vh" as DimensionValue,
      default: "80%",
    }),
  },
  tagInputDialogInner: {
    gap: 12,
    padding: 12,
  },
});
