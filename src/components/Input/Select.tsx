import { IconChevronDown, IconChevronUp } from "@/assets/svg";
import { createStyles, useTheme, vars } from "@/styles";
import { useBooleanState } from "@/utils/states";
import type { ReactElement, ReactNode } from "react";
import { useId, useMemo, useRef, useState, type FC } from "react";
import type { AccessibilityProps, StyleProp, ViewStyle } from "react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { IconButton } from "../Button";
import { useWebHover } from "../Button/useWebHover";
import type { TextProps } from "../Typography";
import { Text } from "../Typography";
import { styles } from "./Input.styles";
import {
  ITEM_HEIGHT,
  MARGIN,
  MAX_DROPDOWN_HEIGHT,
  SEARCH_HEADER_HEIGHT,
} from "./selectConstants";
import { nextMultiSelectValues } from "./selectMulti";
import { SelectPopover } from "./SelectPopover";
import type { InputProps } from "./TextInput";
import { isDesktop } from "@/utils/device";

export interface CoreSelectProps<TValue> {
  options: SelectOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue, option: SelectOption<TValue>) => void;
  showSearch?: boolean;
  freeSolo?: boolean;
  selectedValues?: TValue[];
  closeOnSelect?: boolean;
  showCheckbox?: boolean;
  presentation?: "dialog" | "sheet";
}

export interface SelectProps<TValue> extends CoreSelectProps<TValue> {
  Icon?: FC<SvgProps>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  size?: InputProps["size"];
  renderCurrentOption?: (option: SelectOption<TValue>) => React.ReactNode;
  textProps?: TextProps;
  inline?: boolean;
  iconOnly?: boolean;
  hoverLabel?: string;
  children?: ReactNode;
  /** When set, overrides the chevron (and optional left Icon) color so it matches custom trigger text styling */
  triggerIconColor?: string;
}

export interface MultiSelectProps<TValue>
  extends Omit<SelectProps<TValue>, "value" | "onValueChange"> {
  multiple: true;
  value: TValue[];
  onValueChange: (value: TValue[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export interface SelectOption<TValue> {
  Icon?: FC<SvgProps>;
  left?: ReactNode;
  label: string | ReactNode;
  value: TValue;
  meta?: any;
  alt?: string | string[];
  sticky?: boolean;
  disabled?: boolean;
}

// Web/Electron only: scroll the nearest scrollable ancestor (or the window) so
// there are at least `neededBelow` px beneath `node`. Lets dropdowns open below
// their trigger without overflowing the viewport when the trigger sits low on
// screen. No-op when there is already enough room.
function ensureSpaceBelow(node: HTMLElement | null, neededBelow: number) {
  if (!node?.getBoundingClientRect) return;
  const overflow =
    node.getBoundingClientRect().bottom +
    neededBelow +
    MARGIN -
    window.innerHeight;
  if (overflow <= 0) return;
  let el = node.parentElement;
  while (el) {
    const { overflowY } = window.getComputedStyle(el);
    const scrollable = overflowY === "auto" || overflowY === "scroll";
    if (scrollable && el.scrollHeight > el.clientHeight) {
      el.scrollTop += overflow;
      return;
    }
    el = el.parentElement;
  }
  window.scrollBy(0, overflow);
}

export function Select<TValue>(
  props: SelectProps<TValue> & AccessibilityProps,
): ReactElement;
export function Select<TValue>(
  props: MultiSelectProps<TValue> & AccessibilityProps,
): ReactElement;
export function Select<TValue>(
  props: (SelectProps<TValue> | MultiSelectProps<TValue>) & AccessibilityProps,
) {
  const {
    disabled,
    Icon,
    style,
    hoverStyle,
    value,
    onValueChange,
    options,
    size = "md",
    renderCurrentOption,
    textProps,
    inline,
    showSearch,
    freeSolo,
    iconOnly = false,
    hoverLabel,
    children,
    triggerIconColor,
    multiple,
    placeholder,
    maxSelections,
    presentation,
    ...restProps
  } = props as SelectProps<TValue> &
    Partial<
      Pick<
        MultiSelectProps<TValue>,
        "multiple" | "placeholder" | "maxSelections"
      >
    > &
    AccessibilityProps;
  const isMultiple = multiple === true;
  const selectedValues = isMultiple && Array.isArray(value) ? value : undefined;
  const theme = useTheme();
  const iconColor =
    triggerIconColor ??
    (isDesktop
      ? theme.colors.textSecondary
      : theme.colors.commandNeutralDefault);
  const triggerRef = useRef<View>(null);
  const { isHovered, webHoverProps } = useWebHover();
  const [triggerPosition, setTriggerPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [isOpen, open, close] = useBooleanState();

  const handleOpen = () => {
    if (
      Platform.OS === "web" &&
      presentation !== "sheet" &&
      triggerRef.current
    ) {
      // Make room beneath the trigger so the dropdown opens below it without
      // running off the bottom of the viewport. Measure after the scroll so the
      // trigger position reflects its new spot.
      const estimatedDropdownHeight = Math.min(
        MAX_DROPDOWN_HEIGHT,
        options.length * ITEM_HEIGHT +
          (showSearch ? SEARCH_HEADER_HEIGHT : 0) +
          16,
      );
      ensureSpaceBelow(
        triggerRef.current as unknown as HTMLElement,
        estimatedDropdownHeight,
      );
      requestAnimationFrame(() => {
        if (triggerRef.current) {
          triggerRef.current.measureInWindow(
            (x: number, y: number, width: number, height: number) => {
              setTriggerPosition({ x, y, width, height });
              open();
            },
          );
        }
      });
    } else {
      open();
    }
  };

  const handleClose = () => {
    close();
    setTriggerPosition(null);
  };

  const currentOption = useMemo(() => {
    if (isMultiple) return undefined;
    return options.find((option) => option.value === value);
  }, [isMultiple, options, value]);

  const currentValueNode = useMemo(() => {
    if (isMultiple && Array.isArray(value)) {
      const selected = options.filter((option) => value.includes(option.value));
      if (!selected.length) return placeholder ?? "Select";
      return selected
        .map((option) =>
          typeof option.label === "string"
            ? option.label
            : String(option.value),
        )
        .join(", ");
    }
    if (!currentOption) return String(value);
    return renderCurrentOption?.(currentOption) || currentOption.label;
  }, [
    currentOption,
    isMultiple,
    options,
    placeholder,
    renderCurrentOption,
    value,
  ]);

  const handlePopoverValueChange = (
    nextValue: TValue,
    option: SelectOption<TValue>,
  ) => {
    if (isMultiple && Array.isArray(value)) {
      const next = nextMultiSelectValues(value, nextValue, maxSelections);
      if (next) (props as MultiSelectProps<TValue>).onValueChange(next);
      return;
    }
    (onValueChange as SelectProps<TValue>["onValueChange"])(nextValue, option);
  };

  const id = useId();

  const renderTrigger = () => {
    // If children are provided, use them as the custom trigger
    if (children) {
      return (
        <Pressable
          ref={triggerRef}
          {...webHoverProps}
          style={style}
          onPress={handleOpen}
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={id}
          {...restProps}
        >
          {children}
        </Pressable>
      );
    }

    if (iconOnly) {
      return (
        <View ref={triggerRef}>
          <IconButton
            label={`Select ${currentOption?.label || value}. Current: ${currentOption?.label || value}`}
            hoverLabel={hoverLabel ?? `Change selection`}
            Icon={currentOption?.Icon || Icon || (() => null)}
            style={[iconOnlyStyles.iconButton, style]}
            variant="outlined"
            onPress={handleOpen}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={id}
            {...restProps}
          />
        </View>
      );
    }

    return (
      <Pressable
        ref={triggerRef}
        {...webHoverProps}
        style={({ pressed }) => {
          const effectivePressed =
            Platform.OS === "web" ? isHovered || pressed : pressed;

          return [
            styles.root,
            selectStyles.elevated(theme),
            styles[size],
            selectStyles.root,
            effectivePressed && selectStyles.hover(theme),
            disabled && selectStyles.disableOpacity,
            inline && selectStyles.inline,
            style,
            effectivePressed && hoverStyle,
          ];
        }}
        onPress={handleOpen}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={id}
        {...restProps}
      >
        {Icon && <Icon width={14} height={14} color={iconColor} />}
        <Text
          color={isDesktop ? "textSecondary" : "commandNeutralDefault"}
          numberOfLines={1}
          variant="body2Regular"
          {...textProps}
          style={[!inline && selectStyles.fillText, textProps?.style]}
        >
          {currentValueNode}
        </Text>
        {!disabled &&
          (isOpen ? (
            <IconChevronUp width={14} color={iconColor} />
          ) : (
            <IconChevronDown width={14} color={iconColor} />
          ))}
      </Pressable>
    );
  };

  return (
    <>
      {renderTrigger()}
      {/* Why do we put this <View> here? It is because without it, when the modal is opened, it somehow
       * shift the layout of the Pressable above. But wait! <Modal> is not supposed affect the layout because
       * it is rendered on top of everything else using OS-native view right?
       * Well, no clue, it somehow does lol so this kinda fixes it.
       */}
      <View>
        <SelectPopover
          isOpen={isOpen}
          close={handleClose}
          onValueChange={handlePopoverValueChange}
          value={
            (isMultiple && Array.isArray(value) ? value[0] : value) as TValue
          }
          selectedValues={selectedValues}
          closeOnSelect={!isMultiple}
          showCheckbox={isMultiple}
          options={options}
          id={id}
          showSearch={showSearch}
          freeSolo={freeSolo}
          triggerPosition={triggerPosition}
          presentation={presentation}
        />
      </View>
    </>
  );
}

const selectStyles = createStyles({
  root: {
    gap: 8,
    paddingHorizontal: 16,
  },
  fillText: {
    flex: 1,
  },
  elevated: (theme) => ({
    ...vars.elevations[1],
    borderColor: isDesktop
      ? theme.colors.borderStaticPage
      : theme.colors.borderInteractiveDefault,
    backgroundColor: isDesktop
      ? theme.colors.interactiveSecondaryDefault
      : theme.colors.layerDefault,
  }),
  hover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Hover,
    borderColor: theme.colors.borderInteractiveHover,
  }),
  disableOpacity: {
    opacity: 0.5,
  },
  inline: {
    paddingHorizontal: 0,
    borderWidth: 0,
    elevation: 0,
    boxShadow: "none",
    shadowColor: "transparent",
    backgroundColor: "transparent",
  },
});

const iconOnlyStyles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
