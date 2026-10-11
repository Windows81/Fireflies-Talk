import { createStyles, useTheme, vars } from "@/styles";
import type { AccessibilityProps, StyleProp, ViewStyle } from "react-native";
import { Platform, View, Modal, Pressable } from "react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "../BottomSheet";
import type { DialogProps } from "../Dialog";
import { Dialog } from "../Dialog";
import type { CoreSelectProps } from "./Select";
import {
  ITEM_HEIGHT,
  MARGIN,
  MAX_DROPDOWN_HEIGHT,
  MAX_SHEET_HEIGHT_RATIO,
  SEARCH_HEADER_HEIGHT,
  SHEET_HANDLE_HEIGHT,
} from "./selectConstants";
import { SelectPopoverContent } from "./SelectPopoverContent";

interface SelectPopoverProps<TValue> extends CoreSelectProps<TValue> {
  id?: string;
  isOpen: boolean;
  close: () => void;
  style?: StyleProp<ViewStyle>;
  dialogVariant?: DialogProps["variant"];
  triggerPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export function SelectPopover<TValue>({
  isOpen,
  close,
  style,
  options,
  value,
  onValueChange,
  id,
  showSearch,
  freeSolo,
  selectedValues,
  closeOnSelect,
  showCheckbox,
  dialogVariant = "basic",
  triggerPosition,
  presentation = "dialog",
  ...props
}: SelectPopoverProps<TValue> & AccessibilityProps) {
  const theme = useTheme();
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();

  if (presentation === "sheet") {
    return (
      <SelectSheet
        id={id}
        isOpen={isOpen}
        close={close}
        options={options}
        value={value}
        onValueChange={onValueChange}
        showSearch={showSearch}
        freeSolo={freeSolo}
        selectedValues={selectedValues}
        closeOnSelect={closeOnSelect}
        showCheckbox={showCheckbox}
        accessibilityProps={props}
      />
    );
  }

  // Web-specific custom modal without backdrop
  if (Platform.OS === "web" && triggerPosition) {
    const GUTTER = 4;
    const MIN_WIDTH = 260;

    // Width calculation: prefer trigger width but cap to viewport
    const desiredWidth = Math.max(triggerPosition.width, MIN_WIDTH);
    const maxPossibleWidth = Math.max(0, viewportWidth - MARGIN * 2);
    const dropdownWidth = Math.min(desiredWidth, maxPossibleWidth);

    // Horizontal positioning
    const leftDefault = triggerPosition.x;
    const leftRightAligned =
      triggerPosition.x + triggerPosition.width - dropdownWidth;
    let left = leftDefault;
    if (left + dropdownWidth > viewportWidth - MARGIN) {
      left = leftRightAligned;
    }
    left = Math.max(
      MARGIN,
      Math.min(left, viewportWidth - MARGIN - dropdownWidth),
    );

    // Open directly below the trigger by default — Select.handleOpen scrolls the
    // trigger up first to make room. Only fall back to opening above when there
    // still isn't enough room below and there's more above (e.g. a non-scrollable
    // dialog with the trigger near the bottom). Either way the dropdown is
    // anchored to the trigger's edge, and its height is capped to the available
    // space so it can never float detached or overflow the viewport edge.
    const spaceBelow =
      viewportHeight - (triggerPosition.y + triggerPosition.height) - MARGIN;
    const spaceAbove = triggerPosition.y - MARGIN;

    const SEARCH_HEADER_ESTIMATE = showSearch ? SEARCH_HEADER_HEIGHT : 0;
    // The height the list would like, capped at the absolute max.
    const naturalHeight = Math.min(
      MAX_DROPDOWN_HEIGHT,
      options.length * ITEM_HEIGHT + SEARCH_HEADER_ESTIMATE,
    );
    // Prefer below (Select.handleOpen scrolls to make room first), but flip above
    // when the content can't fit below AND there's more room above. This keeps
    // direct SelectPopover consumers — which don't scroll — at full height
    // instead of cramming a tall list into a short space below the trigger.
    const placeBelow =
      spaceBelow - GUTTER >= naturalHeight || spaceBelow >= spaceAbove;
    const available = Math.max(0, placeBelow ? spaceBelow : spaceAbove);

    // Cap to the available space minus the GUTTER offset between trigger and
    // dropdown (no minimum floor), so the dropdown keeps the full MARGIN from the
    // viewport edge; the list scrolls internally when space is tight.
    const containerMaxHeight = Math.min(
      MAX_DROPDOWN_HEIGHT,
      Math.max(0, available - GUTTER),
    );
    const listMaxHeight = Math.max(
      0,
      containerMaxHeight - SEARCH_HEADER_ESTIMATE,
    );

    const verticalPosition = placeBelow
      ? { top: triggerPosition.y + triggerPosition.height + GUTTER }
      : { bottom: viewportHeight - triggerPosition.y + GUTTER };
    return (
      <Modal
        transparent
        visible={isOpen}
        onRequestClose={close}
        animationType="none"
      >
        <Pressable
          style={webStyles.backdrop}
          onPress={close}
          nativeID="no-drag"
        />
        <View
          style={[
            webStyles.dropdown(theme),
            {
              left,
              ...verticalPosition,
              width: dropdownWidth,
              maxHeight: containerMaxHeight,
            },
          ]}
        >
          <SelectPopoverContent
            options={options}
            value={value}
            onValueChange={onValueChange}
            close={close}
            showSearch={showSearch}
            freeSolo={freeSolo}
            selectedValues={selectedValues}
            closeOnSelect={closeOnSelect}
            showCheckbox={showCheckbox}
            maxListHeight={listMaxHeight}
          />
        </View>
      </Modal>
    );
  }

  // Standard dialog rendering for mobile/native
  return (
    <Dialog.Root
      isOpen={isOpen}
      close={close}
      variant={dialogVariant}
      style={[styles.dialog, style]}
      id={id}
      {...props}
    >
      <SelectPopoverContent
        options={options}
        value={value}
        onValueChange={onValueChange}
        close={close}
        showSearch={showSearch}
        freeSolo={freeSolo}
        selectedValues={selectedValues}
        closeOnSelect={closeOnSelect}
        showCheckbox={showCheckbox}
      />
    </Dialog.Root>
  );
}

function SelectSheet<TValue>({
  id,
  isOpen,
  accessibilityProps,
  ...contentProps
}: CoreSelectProps<TValue> & {
  id?: string;
  isOpen: boolean;
  close: () => void;
  accessibilityProps: AccessibilityProps;
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const sheetHeight = Math.min(
    SHEET_HANDLE_HEIGHT +
      (contentProps.showSearch ? SEARCH_HEADER_HEIGHT : 0) +
      contentProps.options.length * ITEM_HEIGHT +
      safeAreaInsets.bottom,
    viewportHeight * MAX_SHEET_HEIGHT_RATIO,
  );

  return (
    <BottomSheet.Root
      isOpen={isOpen}
      close={contentProps.close}
      snapPoints={[sheetHeight]}
    >
      <View nativeID={id} style={styles.sheet} {...accessibilityProps}>
        {/* Inset inside the scroll, so the list still reaches a raised keyboard. */}
        <SelectPopoverContent
          {...contentProps}
          presentation="sheet"
          listPaddingBottom={safeAreaInsets.bottom}
        />
      </View>
    </BottomSheet.Root>
  );
}

const styles = createStyles({
  dialog: {
    overflow: "hidden",
  },
  sheet: {
    flex: 1,
  },
});

const webStyles = createStyles({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    cursor: "auto",
  },
  dropdown: (theme) => ({
    ...vars.elevations[2],
    position: "absolute",
    maxHeight: MAX_DROPDOWN_HEIGHT,
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    overflow: "hidden",
  }),
});
