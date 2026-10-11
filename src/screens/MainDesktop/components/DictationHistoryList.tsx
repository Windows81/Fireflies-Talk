import { useIsFocused } from "@react-navigation/native";
import { useHoverWithin } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { useDictationDayFocus } from "@/hooks/dictationDayFocus";
import { useDictationHistory } from "@/hooks/dictationHistory";
import { useIsDictationAvailable } from "@/hooks/useIsDictationAvailable";
import {
  filterDictationEntries,
  groupEntriesByDay,
  listPasteTargets,
} from "@/hooks/dictationHistoryGroups";
import { useCurrentDayKey } from "@/hooks/useCurrentDayKey";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { parseISO } from "date-fns";
import type { FC } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { DictationCard } from "./DictationCard";
import { DictationHistoryToolbar } from "./DictationHistoryToolbar";

const emptyMessage = (
  query: string,
  selectedApps: string[],
  talkEnabled: boolean,
): string => {
  const trimmed = query.trim();
  if (trimmed && selectedApps.length) {
    return `No dictations match "${trimmed}" in the selected apps.`;
  }
  if (trimmed) return `No dictations match "${trimmed}".`;
  if (selectedApps.length) return "No dictations in the selected apps.";
  if (!talkEnabled) return "No dictations yet.";
  return "No dictations yet. Press your push to talk shortcut to get started.";
};

export const DictationHistoryList: FC = () => {
  const isDictationAvailable = useIsDictationAvailable();
  const userId = useAuth((s) => s.user?.id);
  const allEntries = useDictationHistory((s) => s.entries);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Empty means every app — the "All apps" row.
  const [pickedApps, setSelectedApps] = useState<string[]>([]);
  // Keeps the TODAY/YESTERDAY labels honest when the day turns over.
  const dayKey = useCurrentDayKey();
  const dayNodes = useRef(new Map<string, View>());
  const requestedDay = useDictationDayFocus((s) => s.requestedDay);
  const clearRequest = useDictationDayFocus((s) => s.clearRequest);
  // This screen is mounted more than once — see consentSetupPrompt.store — and
  // the day request is module-global, so a hidden copy must not scroll itself
  // and clear the request before the copy on screen sees it.
  const isFocused = useIsFocused();
  const sectionRef = useRef<View | null>(null);
  const toolbarRef = useRef<View | null>(null);
  const [isToolbarFocused, setIsToolbarFocused] = useState(false);
  // Coordinate-based so the toolbar does not flicker as the pointer crosses
  // the cards. It stays up whenever it is in use, or the pointer would leave
  // the area and take an open search field or an applied filter with it.
  const isHistoryHovered = useHoverWithin(sectionRef);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;

    const node = toolbarRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const handleFocusIn = () => setIsToolbarFocused(true);
    const handleFocusOut = (event: FocusEvent) => {
      if (node.contains(event.relatedTarget as Node)) return;
      setIsToolbarFocused(false);
    };

    node.addEventListener("focusin", handleFocusIn);
    node.addEventListener("focusout", handleFocusOut);
    return () => {
      node.removeEventListener("focusin", handleFocusIn);
      node.removeEventListener("focusout", handleFocusOut);
    };
  });

  const entries = useMemo(
    () => allEntries.filter((entry) => entry.userId === userId),
    [allEntries, userId],
  );

  const pasteTargets = useMemo(() => listPasteTargets(entries), [entries]);
  // Deleting the last dictation pasted into an app removes it from the filter
  // menu, so a pick for it would hide new dictations with no way to undo it.
  // The pick is forgotten, not just masked, or it would spring back the next
  // time that app shows up.
  const availablePicks = pickedApps.filter((app) => pasteTargets.includes(app));
  const hasStalePicks = availablePicks.length !== pickedApps.length;
  if (hasStalePicks) setSelectedApps(availablePicks);
  const selectedApps = hasStalePicks ? availablePicks : pickedApps;
  const showToolbar =
    isHistoryHovered ||
    isToolbarFocused ||
    isSearchOpen ||
    isFilterOpen ||
    selectedApps.length > 0;

  const grouped = useMemo(
    () =>
      groupEntriesByDay(
        filterDictationEntries(entries, { query, apps: selectedApps }),
        parseISO(dayKey),
      ),
    [dayKey, entries, query, selectedApps],
  );

  // A day clicked in the streak grid scrolls its group into view, stopping at
  // the day's label. The list sits inside the screen's ScrollView, so the
  // group's own node does the scrolling.
  useEffect(() => {
    if (!requestedDay || !isFocused) return;

    const node = dayNodes.current.get(requestedDay) as
      | { scrollIntoView?: (options: object) => void }
      | undefined;

    // The grid offers every day that has a dictation, but the list only renders
    // the days that survive the filters. Rather than swallow the click, drop
    // the filters and let the next render scroll to the day.
    if (!node && (query || selectedApps.length)) {
      setQuery("");
      setSelectedApps([]);
      setIsSearchOpen(false);
      return;
    }

    node?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    clearRequest();
  }, [requestedDay, isFocused, clearRequest, query, selectedApps, grouped]);

  const tableHeader = (
    <View style={styles.tableHeader}>
      <Text variant="title1Weight" color="textPrimary">
        Your dictations
      </Text>
      <View
        ref={toolbarRef}
        style={!showToolbar && styles.toolbarHidden}
        pointerEvents={showToolbar ? "auto" : "none"}
      >
        <DictationHistoryToolbar
          pasteTargets={pasteTargets}
          selectedApps={selectedApps}
          onSelectedAppsChange={setSelectedApps}
          query={query}
          onQueryChange={setQuery}
          isSearchOpen={isSearchOpen}
          onSearchOpenChange={setIsSearchOpen}
          isFilterOpen={isFilterOpen}
          onFilterOpenChange={setIsFilterOpen}
        />
      </View>
    </View>
  );

  if (grouped.length === 0) {
    return (
      <View ref={sectionRef} style={styles.section}>
        {tableHeader}
        <View style={styles.empty}>
          <Text variant="body2Regular" color="textMuted">
            {emptyMessage(query, selectedApps, isDictationAvailable)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View ref={sectionRef} style={styles.section}>
      {tableHeader}
      {grouped.map((group) => (
        <View
          key={group.key}
          style={styles.dayGroup}
          ref={(node) => {
            if (node) dayNodes.current.set(group.key, node);
            else dayNodes.current.delete(group.key);
          }}
        >
          <Text variant="body3Weight" color="textMuted" style={styles.dayLabel}>
            {group.label}
          </Text>
          <View style={styles.dayEntries}>
            {group.entries.map((entry, index) => (
              <View
                key={entry.id}
                style={index > 0 ? styles.entryDivided : undefined}
              >
                <DictationCard entry={entry} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = createStyles({
  section: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: 768,
    gap: 24,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
    gap: 16,
  },
  toolbarHidden: {
    opacity: 0,
  },
  dayGroup: {
    alignSelf: "stretch",
    gap: 12,
  },
  dayLabel: {
    letterSpacing: 0.6,
  },
  dayEntries: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: withAlpha(DESKTOP_THEME.grey100, 0.07),
    borderRadius: 12,
    overflow: "hidden",
  },
  entryDivided: {
    borderTopWidth: 1,
    borderTopColor: withAlpha(DESKTOP_THEME.grey100, 0.07),
  },
  empty: {
    paddingVertical: 20,
    alignItems: "center",
    alignSelf: "stretch",
  },
});
