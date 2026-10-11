import { IconArrowUp, IconX } from "@/assets/svg";
import { useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import type { FC, ReactNode } from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type {
  AccessibilityProps,
  TextInputProps as RNTextInputProps,
  StyleProp,
  TextInputProps,
  TextInputSubmitEditingEventData,
  TextStyle,
  ViewStyle,
} from "react-native";
import {
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { SvgProps } from "react-native-svg";
import type { IconButtonProps } from "../Button";
import { IconButton } from "../Button";
import { HoverTooltip } from "../HoverTooltip";
import { getNumberOfLinesStyle, styles } from "./Input.styles";

// Platform workaround: React Native exposes `setSelection` on TextInput refs,
// but on web the underlying DOM element uses `setSelectionRange` instead.
type TextSelectionRef = RNTextInput & {
  setSelection?: (start: number, end: number) => void;
  setSelectionRange?: (start: number, end: number) => void;
};

export type UsuableRNTexInputProps = Pick<
  RNTextInputProps,
  | "autoFocus"
  | "enterKeyHint"
  | "placeholder"
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "numberOfLines"
  | "onKeyPress"
  | "returnKeyType"
  | "textAlignVertical"
>;

export interface InputProps extends UsuableRNTexInputProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  onSubmitEditing?: (e: {
    nativeEvent: TextInputSubmitEditingEventData;
  }) => void;
  onClear?: () => void;
  Icon?: FC<SvgProps>;
  trailing?: ReactNode;
  submitButton?: boolean | IconButtonProps;
  clearable?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: "outlined" | "filled" | "inlined" | "underlined" | "search";
  /**
   * non design system prop
   */
  size?: "sm" | "md";
  onFocus?: TextInputProps["onFocus"];
  onBlur?: TextInputProps["onBlur"];
  /** Custom text style for the inner input (e.g. custom font size) */
  textStyle?: StyleProp<TextStyle>;
  /** Tooltip label shown on hover (e.g. "Rename"). Only works with underlined variant. */
  tooltipLabel?: string;
  /** Swap the underlying input, e.g. gorhom's BottomSheetTextInput when nested in a BottomSheet. */
  InputComponent?: typeof RNTextInput;
  /** Web: keydown on the inner input. Arrow keys do not fire `onKeyPress`. */
  onKeyDown?: (event: {
    key?: string;
    nativeEvent?: { key?: string };
    preventDefault?: () => void;
  }) => void;
}

export const TextInput = forwardRef<
  RNTextInput,
  InputProps & AccessibilityProps
>(function TextInput(
  {
    value: propValue,
    onValueChange,
    defaultValue,
    disabled,
    onSubmitEditing,
    onClear,
    Icon,
    trailing,
    clearable,
    style,
    variant = "outlined",
    onFocus,
    onBlur,
    numberOfLines,
    submitButton,
    textStyle,
    tooltipLabel,
    InputComponent = RNTextInput,
    ...props
  },
  forwardedRef,
) {
  const theme = useTheme();
  const innerRef = useRef<RNTextInput>(null);
  const ref = (forwardedRef ?? innerRef) as React.RefObject<RNTextInput>;
  const [hover, setHoverTrue, setHoverFalse] = useBooleanState();
  const [focused, setFocusedTrue, setFocusedFalse] = useBooleanState();
  // Resolve optional variant-specific styles (e.g. underlinedSizer, underlinedInput)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = styles as Record<string, any>;
  const sizerStyle = s[`${variant}Sizer`]?.(theme);
  const inputOverride = s[`${variant}Input`]?.(theme);

  // need to track this value in case of
  // uncontrolled component
  const [value, setValue] = useState(propValue || defaultValue || "");
  useEffect(() => {
    if (typeof propValue === "string") setValue(propValue);
  }, [propValue]);

  if (clearable && value) {
    trailing = (
      <TouchableOpacity
        aria-label="Clear input"
        onPress={() => {
          onValueChange?.("");
          onClear?.();
        }}
        style={styles.clear}
        role="button"
      >
        <IconX color={theme.colors.textMuted} width={20} height={20} />
      </TouchableOpacity>
    );
  }

  const onButtonSubmit = () => {
    onSubmitEditing?.({ nativeEvent: { text: value } });
  };

  const onChangeText = useCallback(
    (text: string) => {
      setValue(text);
      onValueChange?.(text);
    },
    [onValueChange],
  );

  const showSubmitButton = !!focused || value.trim();
  const setSelectionToEnd = useCallback(
    (length: number) => {
      const current = ref.current as TextSelectionRef | null;
      if (!current) return;

      if (typeof current.setSelection === "function") {
        current.setSelection(length, length);
        return;
      }

      if (typeof current.setSelectionRange === "function") {
        current.setSelectionRange(length, length);
      }
    },
    [ref],
  );

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
      setFocusedTrue();
      if (sizerStyle && ref.current) {
        setSelectionToEnd(value.length);
      }
      onFocus?.(e);
    },
    [sizerStyle, onFocus, setFocusedTrue, setSelectionToEnd, value.length, ref],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
      setFocusedFalse();
      onBlur?.(e);
    },
    [onBlur, setFocusedFalse],
  );

  const handlePress = useCallback(() => {
    ref.current?.focus();
  }, [ref]);

  const content = (
    <View
      style={[
        styles.root,
        styles[variant](theme),
        hover && styles[`${variant}Hover`](theme),
        focused && styles[`${variant}Focused`](theme),
        !tooltipLabel && style,
      ]}
      {...(!focused && sizerStyle && { onPointerDown: handlePress })}
    >
      {Icon && (
        <View style={styles.leading}>
          <Icon color={theme.colors.textMuted} width={20} height={20} />
        </View>
      )}
      {sizerStyle && (
        <Text
          style={[
            styles.input(theme),
            sizerStyle,
            { whiteSpace: "pre" } as TextStyle,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {value || " "}
        </Text>
      )}
      <InputComponent
        ref={ref}
        placeholderTextColor={theme.colors.textMuted}
        onPointerEnter={setHoverTrue}
        onPointerLeave={setHoverFalse}
        onFocus={handleFocus}
        onBlur={handleBlur}
        readOnly={disabled || (!!sizerStyle && !focused)}
        value={value}
        onChangeText={onChangeText}
        defaultValue={defaultValue}
        onSubmitEditing={onSubmitEditing}
        style={[
          styles.input(theme),
          disabled && styles.inputDisabled(theme),
          getNumberOfLinesStyle(numberOfLines),
          inputOverride,
          textStyle,
        ]}
        multiline={!!numberOfLines && numberOfLines > 1}
        cursorColor={theme.colors.layerContrast}
        {...props}
      />
      <View style={styles.trailing}>
        {trailing}
        {submitButton && showSubmitButton && (
          <IconButton
            Icon={IconArrowUp}
            size="sm"
            {...(typeof submitButton === "object" && submitButton)}
            label={
              typeof submitButton === "object" ? submitButton.label : "Submit"
            }
            disabled={disabled || !value.trim()}
            onPress={onButtonSubmit}
          />
        )}
      </View>
    </View>
  );

  if (tooltipLabel) {
    return (
      <HoverTooltip
        label={tooltipLabel}
        position="bottom"
        disabled={focused}
        style={style}
      >
        {content}
      </HoverTooltip>
    );
  }

  return content;
});
