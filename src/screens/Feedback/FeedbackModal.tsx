import { IconStar } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { TextInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import { toast } from "@/components/Toast";
import { EnumFeedbackType, useGiveFeedbackMutation } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useFeedbackClientInfo } from "@/hooks/useFeedbackClientInfo";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";

const STAR_COUNT = 5;

const DEFAULT_FEEDBACK_CATEGORIES = [
  "Irrelevant suggestions",
  "Slow to respond",
  "Too many suggestions",
  "Technical Issue",
  "Other",
] as const;

export interface FeedbackModalProps {
  isOpen: boolean;
  close: () => void;
  onShare?: (rating: number, comment: string, categories?: string[]) => void;
  category?: string;
  title?: string;
  description?: string;
  feedbackCategories?: readonly string[];
}

export const FeedbackModal: FC<FeedbackModalProps> = ({
  isOpen,
  close,
  onShare,
  category,
  title = "How was the live assist?",
  description = "Your feedback matters! Help us improve the experience for you.",
  feedbackCategories = DEFAULT_FEEDBACK_CATEGORIES,
}) => {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const { appVersion, os } = useFeedbackClientInfo();

  const [giveFeedback, { loading: giveFeedbackLoading }] =
    useGiveFeedbackMutation({
      onCompleted() {
        onShare?.(rating, comment, Array.from(selectedCategories));
        setRating(0);
        setComment("");
        setSelectedCategories(new Set());
        close();
      },
      onError() {
        toast({ message: "Could not submit feedback", type: "error" });
      },
    });

  const showCategoriesStep = rating > 0 && rating < 4;
  const effectiveFill = hoveredStar ?? rating;

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleCancel = () => {
    setRating(0);
    setComment("");
    setSelectedCategories(new Set());
    close();
  };

  const handleShare = () => {
    giveFeedback({
      variables: {
        input: {
          type: EnumFeedbackType.Feedback,
          category,
          subcategory:
            selectedCategories.size > 0
              ? Array.from(selectedCategories).join(",")
              : undefined,
          rating,
          content: comment.trim() || undefined,
          appVersion,
          os,
        },
      },
    });
  };

  const hasComment = comment.trim().length > 0;
  const canShare =
    rating > 0 &&
    hasComment &&
    (showCategoriesStep ? selectedCategories.size > 0 : true);

  return (
    <Dialog.Root
      isOpen={isOpen}
      close={close}
      variant="basic"
      overlayStyle={styles.modalOverlayStyle}
    >
      <View nativeID="no-drag" style={styles.modalContent}>
        <View style={styles.header}>
          <Text variant="title2Weight">{title}</Text>
        </View>
        <View style={styles.description}>
          <Text variant="body2Regular" color="textHint">
            {description}
          </Text>
        </View>
        <View style={styles.body}>
          {!showCategoriesStep ? (
            <View
              style={styles.starRow}
              onPointerLeave={() => setHoveredStar(null)}
            >
              {Array.from({ length: STAR_COUNT }, (_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= effectiveFill;
                const starColor = isFilled
                  ? theme.colors.textBrand
                  : theme.colors.commandHintDefault;

                return (
                  <Pressable
                    key={starValue}
                    onPress={() => setRating(starValue)}
                    onPointerEnter={() => setHoveredStar(starValue)}
                    style={styles.starButton}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${starValue} out of ${STAR_COUNT} stars`}
                    accessibilityState={{ selected: isFilled }}
                  >
                    <IconStar
                      color={starColor}
                      width={32}
                      height={32}
                      strokeWidth={1.5}
                      {...(isFilled && { fill: starColor })}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.categoriesWrap}>
              {feedbackCategories.map((category) => {
                const isSelected = selectedCategories.has(category);
                const isHovered = hoveredCategory === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => toggleCategory(category)}
                    onPointerEnter={() => setHoveredCategory(category)}
                    onPointerLeave={() => setHoveredCategory(null)}
                    style={[
                      styles.categoryChip(theme),
                      isSelected && styles.categoryChipSelected(theme),
                      isHovered && styles.categoryChipHover(theme),
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={category}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      variant="body2Regular"
                      color={isSelected ? "textBrand" : "textSecondary"}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <TextInput
            placeholder="Help us understand more..."
            value={comment}
            onValueChange={setComment}
            numberOfLines={4}
            variant="filled"
            style={styles.textArea}
          />
        </View>

        <Dialog.Actions>
          <Button
            variant="secondary"
            onPress={handleCancel}
            disabled={giveFeedbackLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleShare}
            disabled={!canShare || giveFeedbackLoading}
          >
            {giveFeedbackLoading ? "Sharing..." : "Share"}
          </Button>
        </Dialog.Actions>
      </View>
    </Dialog.Root>
  );
};

const styles = createStyles({
  modalContent: {
    flex: 1,
    flexDirection: "column",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 4,
  },
  description: {
    paddingHorizontal: 20,
    paddingVertical: 0,
  },
  body: {
    padding: 20,
    gap: 36,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: (theme) => ({
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticPage,
    backgroundColor: theme.colors.interactiveSecondaryDisabled,
  }),
  categoryChipSelected: (theme) => ({
    borderColor: theme.colors.commandPrimaryDefault,
    backgroundColor:
      theme.name === "dark-vibrant"
        ? DESKTOP_THEME.purple1000
        : theme.colors.interactiveSecondaryDefault,
    boxShadow: "0 2px 2px 0 rgba(16, 24, 40, 0.04)",
  }),
  categoryChipHover: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
  }),
  textArea: {
    minHeight: 88,
    alignSelf: "stretch",
  },
  modalOverlayStyle: {
    backgroundColor: "transparent",
  },
});
