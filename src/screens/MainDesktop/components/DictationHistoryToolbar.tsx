import { IconFilter, IconSearch, IconX } from "@/assets/svg";
import { Checkbox } from "@/components/Checkbox";
import { HoverTooltip } from "@/components/HoverTooltip";
import { MenuPopover } from "@/components/Menu";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { useEffect, useRef, useState, type FC } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PasteTargetIcon } from "./DictationPasteTarget";

const SEARCH_CLOSED_WIDTH = 32;
const SEARCH_OPEN_WIDTH = 300;
// Same height as the `sm` design-system input, so it lines up with the rest.
const SEARCH_HEIGHT = 36;

interface DictationHistoryToolbarProps {
  /** Apps present in the history, for the filter menu. */
  pasteTargets: string[];
  selectedApps: string[];
  onSelectedAppsChange: (apps: string[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
  isSearchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  /**
   * Held by the list rather than here: the filter menu renders outside the
   * history area, and the toolbar must stay on screen while it is open.
   */
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export const DictationHistoryToolbar: FC<DictationHistoryToolbarProps> = ({
  pasteTargets,
  selectedApps,
  onSelectedAppsChange,
  query,
  onQueryChange,
  isSearchOpen,
  onSearchOpenChange,
  isFilterOpen,
  onFilterOpenChange,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const filterTriggerRef = useRef<View | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const openProgress = useSharedValue(0);

  useEffect(() => {
    openProgress.value = withTiming(isSearchOpen ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    // Focused here rather than with autoFocus so the field is only taken over
    // when the user opens it, never on mount.
    if (isSearchOpen) inputRef.current?.focus();
    else inputRef.current?.blur();
  }, [isSearchOpen, openProgress]);

  // The field grows out of the icon's corner; the icon stays put while the
  // input and its clear button fade in behind it. The border only reads as
  // active while the input really has focus.
  const borderColor = isFocused
    ? theme.colors.borderInteractiveActive
    : theme.colors.borderStaticDefault;
  const backgroundColor = theme.colors.interactiveNeutral2Default;
  const borderColors = [withAlpha(borderColor, 0), borderColor];
  const backgroundColors = [withAlpha(backgroundColor, 0), backgroundColor];
  const fieldStyle = useAnimatedStyle(
    () => ({
      width: interpolate(
        openProgress.value,
        [0, 1],
        [SEARCH_CLOSED_WIDTH, SEARCH_OPEN_WIDTH],
      ),
      borderColor: interpolateColor(openProgress.value, [0, 1], borderColors),
      backgroundColor: interpolateColor(
        openProgress.value,
        [0, 1],
        backgroundColors,
      ),
    }),
    [borderColor, backgroundColor],
  );
  const inputStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
  }));

  const closeSearch = () => {
    onSearchOpenChange(false);
    onQueryChange("");
  };

  const clearQuery = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  const toggleApp = (app: string) =>
    onSelectedAppsChange(
      selectedApps.includes(app)
        ? selectedApps.filter((name) => name !== app)
        : [...selectedApps, app],
    );

  return (
    <View style={styles.actions}>
      {pasteTargets.length > 0 && (
        <>
          <HoverTooltip label="Filter by app" position="bottom" align="center">
            <Pressable
              ref={filterTriggerRef}
              style={styles.iconButton}
              onPress={() => onFilterOpenChange(true)}
              accessibilityRole="button"
              accessibilityLabel="Filter by app"
            >
              <IconFilter
                width={18}
                height={18}
                color={
                  selectedApps.length
                    ? theme.colors.textSecondary
                    : theme.colors.textMuted
                }
              />
            </Pressable>
          </HoverTooltip>
          <MenuPopover
            isOpen={isFilterOpen}
            close={() => onFilterOpenChange(false)}
            triggerRef={filterTriggerRef}
            placement="bottom"
            align="end"
            width={220}
            offset={6}
          >
            <View style={styles.filterMenu}>
              <Checkbox
                label="All apps"
                value={selectedApps.length === 0}
                onValueChange={() => onSelectedAppsChange([])}
                size={16}
                style={styles.filterRow}
              />
              <View style={styles.filterDivider} />
              {pasteTargets.map((app) => (
                <Checkbox
                  key={app}
                  label={app}
                  labelLeft={<PasteTargetIcon app={app} size={16} />}
                  value={selectedApps.includes(app)}
                  onValueChange={() => toggleApp(app)}
                  size={16}
                  style={styles.filterRow}
                />
              ))}
            </View>
          </MenuPopover>
        </>
      )}

      <Animated.View style={[styles.searchField, fieldStyle]}>
        <HoverTooltip
          label={isSearchOpen ? "Close search" : "Search dictations"}
          position="bottom"
          align="center"
        >
          <Pressable
            style={styles.iconButton}
            onPress={() =>
              isSearchOpen ? closeSearch() : onSearchOpenChange(true)
            }
            accessibilityRole="button"
            accessibilityLabel={
              isSearchOpen ? "Close search" : "Search dictations"
            }
          >
            <IconSearch width={18} height={18} color={theme.colors.textMuted} />
          </Pressable>
        </HoverTooltip>
        <Animated.View
          style={[styles.searchInputRow, inputStyle]}
          pointerEvents={isSearchOpen ? "auto" : "none"}
        >
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search dictations"
            placeholderTextColor={theme.colors.textHint}
            style={styles.searchInput(theme)}
            returnKeyType="search"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {query.length > 0 && (
            <Pressable
              style={styles.iconButton}
              onPress={clearQuery}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <IconX width={16} height={16} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = createStyles({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    padding: 4,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    height: SEARCH_HEIGHT,
    overflow: "hidden",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchInputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  searchInput: (theme) => ({
    flex: 1,
    minWidth: 0,
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    // web/Electron: Chromium paints its own focus ring on the inner input;
    // the field's border is the focus state instead.
    ...(Platform.OS === "web" && { outline: "none" }),
  }),
  filterMenu: {
    paddingVertical: 6,
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterDivider: {
    height: 1,
    marginVertical: 4,
    backgroundColor: withAlpha(DESKTOP_THEME.grey100, 0.07),
  },
});
