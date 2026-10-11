import { IconCopy, IconThumbsDown, IconTrash } from "@/assets/svg";
import { Button } from "@/components/Button";
import { HoverTooltip } from "@/components/HoverTooltip";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { collapseDictationText } from "@/hooks/dictationCollapseText";
import {
  useDictationHistory,
  type DictationEntry,
} from "@/hooks/dictationHistory";
import { createStyles, useTheme } from "@/styles";
import { copyAsMarkdown } from "@/utils/clipboard";
import { format } from "date-fns";
import type { FC } from "react";
import { useState } from "react";
import {
  Platform,
  View,
  type LayoutChangeEvent,
  type TextStyle,
} from "react-native";
import { DictationFeedbackModal } from "./DictationFeedbackModal";
import { DictationPasteTarget } from "./DictationPasteTarget";

const COLLAPSED_LINES = 2;
// Rough advance width of 14px Inter. Deliberately generous so the collapsed
// copy lands inside two lines rather than spilling onto a third.
const AVERAGE_CHAR_WIDTH = 7.2;
// Room kept back for the trailing "...view more".
const TOGGLE_CHARS = 12;
const MIN_VISIBLE_CHARS = 40;

// The desktop shell turns selection off for the whole document, so the copy
// opts back in. RN's TextStyle has no `cursor: "text"` — react-native-web
// passes it straight through as CSS, hence the cast.
const SELECTABLE_TEXT =
  Platform.OS === "web"
    ? ({ userSelect: "text", cursor: "text" } as unknown as TextStyle)
    : undefined;
// Keeps the ellipsis and the toggle out of a drag-select so a copied fragment
// is only dictation text.
const UNSELECTABLE_TEXT: TextStyle | undefined =
  Platform.OS === "web" ? { userSelect: "none" } : undefined;

interface DictationCardProps {
  entry: DictationEntry;
}

export const DictationCard: FC<DictationCardProps> = ({ entry }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const removeEntry = useDictationHistory((s) => s.removeEntry);
  const showThumbsDown = !!entry.dictationId;

  // "view more" has to sit inline at the end of the copy, which rules out a
  // line clamp — the clamp would cut the link off with the text. So the cut is
  // made in the string instead, budgeting characters from the measured width.
  const budget = textWidth
    ? Math.max(
        MIN_VISIBLE_CHARS,
        Math.floor((textWidth / AVERAGE_CHAR_WIDTH) * COLLAPSED_LINES) -
          TOGGLE_CHARS,
      )
    : 0;
  const collapsed =
    budget > 0
      ? collapseDictationText(entry.text, budget, COLLAPSED_LINES)
      : undefined;
  const isTruncated = !!collapsed;
  const isCollapsed = isTruncated && !isExpanded;
  const visibleText = isCollapsed ? collapsed : entry.text;

  const handleDelete = () => {
    removeEntry(entry.id);
    toast({ message: "Dictation deleted" });
  };

  const handleCopy = () => {
    copyAsMarkdown(entry.text)
      .then(() => toast({ message: "Dictation copied" }))
      .catch(() => toast({ message: "Failed to copy" }));
  };

  // onMouseEnter/onMouseLeave aren't in RN's View type but are passed through
  // by react-native-web — cast to bypass the type mismatch.
  const webHoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } as object;

  return (
    <View
      style={[styles.card, isHovered && styles.cardHovered(theme)]}
      {...webHoverProps}
    >
      <View style={styles.meta}>
        <Text
          variant="body2Regular"
          color="textHint"
          numberOfLines={1}
          style={styles.time}
        >
          {format(new Date(entry.date), "h:mm a")}
        </Text>
        {hasPasteTarget(entry) && <DictationPasteTarget entry={entry} />}
      </View>

      <View style={styles.body}>
        <Text
          variant="body2Regular"
          color="textSecondary"
          style={SELECTABLE_TEXT}
          onLayout={(event: LayoutChangeEvent) =>
            setTextWidth(event.nativeEvent.layout.width)
          }
        >
          {visibleText}
          {isTruncated && (
            <Text
              variant="body2Regular"
              color="textSecondary"
              style={UNSELECTABLE_TEXT}
            >
              {isCollapsed ? "..." : " "}
              <Text
                variant="body2Regular"
                color="textMuted"
                onPress={() => setIsExpanded((expanded) => !expanded)}
              >
                {isCollapsed ? "view more" : "view less"}
              </Text>
            </Text>
          )}
        </Text>
      </View>

      <View
        style={[styles.actions, !isHovered && styles.actionsHidden]}
        pointerEvents={isHovered ? "auto" : "none"}
      >
        <HoverTooltip
          label="Copy to clipboard"
          position="bottom"
          align="center"
        >
          <Button
            variant="transparentNeutral"
            size="xs"
            onPress={handleCopy}
            accessibilityLabel="Copy dictation text"
          >
            <IconCopy width={18} height={18} color={theme.colors.textMuted} />
          </Button>
        </HoverTooltip>
        {showThumbsDown && (
          <HoverTooltip label="Share feedback" position="bottom" align="center">
            <Button
              variant="transparentNeutral"
              size="xs"
              onPress={() => setIsFeedbackOpen(true)}
              accessibilityLabel="Share dictation feedback"
            >
              <IconThumbsDown
                width={18}
                height={18}
                color={theme.colors.textMuted}
              />
            </Button>
          </HoverTooltip>
        )}
        <HoverTooltip label="Delete" position="bottom" align="center">
          <Button
            variant="transparentNeutral"
            size="xs"
            onPress={handleDelete}
            accessibilityLabel="Delete dictation"
          >
            <IconTrash width={18} height={18} color={theme.colors.textMuted} />
          </Button>
        </HoverTooltip>
      </View>
      {isFeedbackOpen && (
        <DictationFeedbackModal
          entry={entry}
          isOpen={isFeedbackOpen}
          close={() => setIsFeedbackOpen(false)}
        />
      )}
    </View>
  );
};

const hasPasteTarget = (entry: DictationEntry): boolean =>
  entry.pasted === false || !!entry.pastedApp;

const styles = createStyles({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%",
  },
  cardHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 152,
    flexShrink: 0,
  },
  // Fixed so the "·" and the paste-target icon land in the same column for
  // every row — "1:06 pm" and "12:09 pm" render at different widths otherwise.
  time: {
    width: 64,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsHidden: {
    opacity: 0,
  },
});
