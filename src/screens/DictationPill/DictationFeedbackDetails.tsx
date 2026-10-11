import { IconInfo } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { HoverTooltip } from "@/components/HoverTooltip";
import { TextInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, type Theme } from "@/styles";
import type { FC, Ref } from "react";
import type { TextInput as RNTextInput } from "react-native";
import { Pressable, View } from "react-native";
import { categoriesFor, isPositiveRating } from "./dictationFeedback";

type Props = {
  rating: number;
  comment: string;
  categories: ReadonlySet<string>;
  canQuote: boolean;
  onCommentChange: (comment: string) => void;
  onToggleCategory: (category: string) => void;
  onCanQuoteChange: (canQuote: boolean) => void;
  onShare: () => void;
  commentRef?: Ref<RNTextInput>;
  autoFocusComment?: boolean;
};

/**
 * The card's second step: a heading that follows the rating's tone, the
 * chip list for that rating, a comment field, and Share. High ratings also
 * get the marketing-quote opt-in; low ratings just tell us what went wrong.
 * The shared form owns the state so either surface can submit it.
 */
export const DictationFeedbackDetails: FC<Props> = ({
  rating,
  comment,
  categories,
  canQuote,
  onCommentChange,
  onToggleCategory,
  onCanQuoteChange,
  onShare,
  commentRef,
  autoFocusComment,
}) => {
  const theme = useTheme();
  const shareButton = useWebHover();
  const disabled = comment.trim().length === 0;

  return (
    <>
      <Text variant="body3Weight" color="dictationTalkTeaserTitle">
        {isPositiveRating(rating)
          ? "What's working for you?"
          : "Anything we should improve?"}
      </Text>
      <View style={styles.chips}>
        {categoriesFor(rating).map((category) => {
          const selected = categories.has(category);
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onToggleCategory(category)}
              style={[
                styles.chip(theme),
                selected && styles.chipSelected(theme),
              ]}
            >
              <Text
                variant="label3Regular"
                color={selected ? "textBrand" : "dictationTalkTeaserBody"}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        ref={commentRef}
        placeholder="Tell us more (required)"
        value={comment}
        onValueChange={onCommentChange}
        numberOfLines={3}
        variant="filled"
        autoFocus={autoFocusComment}
        style={styles.comment}
      />
      {isPositiveRating(rating) && (
        <View style={styles.quoteRow}>
          <Checkbox
            size={16}
            label="Can we quote you?"
            labelColor="dictationTalkTeaserBody"
            value={canQuote}
            onValueChange={onCanQuoteChange}
          />
          <HoverTooltip
            label="We may share your words in Fireflies marketing."
            tone="pill"
            position="top"
          >
            <IconInfo
              width={14}
              height={14}
              color={theme.colors.dictationTalkTeaserBody}
            />
          </HoverTooltip>
        </View>
      )}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onShare}
          style={[
            styles.actionButton(theme),
            !disabled &&
              shareButton.isHovered &&
              styles.actionButtonHover(theme),
            disabled && styles.actionButtonDisabled,
          ]}
          {...shareButton.webHoverProps}
        >
          <Text variant="label2Weight" color="dictationTalkTeaserButtonText">
            Share
          </Text>
        </Pressable>
      </View>
    </>
  );
};

const styles = createStyles({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: (theme: Theme) => ({
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    cursor: "pointer",
    borderColor: theme.colors.borderStaticPage,
    backgroundColor: theme.colors.dictationTalkTeaserButtonSurface,
  }),
  chipSelected: (theme: Theme) => ({
    borderColor: theme.colors.commandPrimaryDefault,
    backgroundColor: theme.colors.dictationTalkTeaserButtonSurfaceHover,
  }),
  comment: {
    alignSelf: "stretch",
    minHeight: 56,
  },
  quoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    alignSelf: "stretch",
  },
  actionButton: (theme: Theme) => ({
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    cursor: "pointer",
    borderColor: theme.colors.dictationTalkTeaserButtonBorder,
    backgroundColor: theme.colors.dictationTalkTeaserButtonSurface,
  }),
  actionButtonHover: (theme: Theme) => ({
    backgroundColor: theme.colors.dictationTalkTeaserButtonSurfaceHover,
  }),
  actionButtonDisabled: {
    opacity: 0.5,
    cursor: "auto",
  },
});
