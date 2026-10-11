import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { sendDictationFeedback } from "@/hooks/dictationApi";
import { isAbortError } from "@/hooks/dictationErrors";
import { MAX_DICTATION_FEEDBACK_REASON_CHARS } from "@/hooks/dictationFeedbackPayload";
import type { DictationEntry } from "@/hooks/dictationHistory";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

const FEEDBACK_CATEGORIES = [
  "Incorrect formatting",
  "Incorrect transcription",
  "Wrong names",
  "Poor interface / usability",
  "Other",
] as const;

const DISCLAIMER =
  "By sending this feedback you agree to share the dictation data with the Fireflies team for analysis.";

export interface DictationFeedbackModalProps {
  entry: DictationEntry;
  isOpen: boolean;
  close: () => void;
}

export const DictationFeedbackModal: FC<DictationFeedbackModalProps> = ({
  entry,
  isOpen,
  close,
}) => {
  const theme = useTheme();
  const [category, setCategory] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetAndClose = () => {
    setCategory(null);
    setReason("");
    setHoveredCategory(null);
    close();
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    submittingRef.current = false;
    resetAndClose();
  };

  const canSend =
    !!category &&
    reason.trim().length > 0 &&
    !!entry.dictationId &&
    !isSubmitting;

  const handleSend = () => {
    if (
      !category ||
      !entry.dictationId ||
      reason.trim().length === 0 ||
      submittingRef.current
    ) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    sendDictationFeedback(
      {
        cleanedText: entry.cleanedText ?? entry.text,
        rawText: entry.rawText ?? entry.text,
        dictationId: entry.dictationId,
        category,
        reason: reason.trim(),
      },
      { signal: controller.signal },
    )
      .then(() => {
        toast({ message: "Thanks for the feedback!" });
        resetAndClose();
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        toast({ message: "Could not submit feedback", type: "error" });
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        submittingRef.current = false;
        abortControllerRef.current = null;
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog.Root
      isOpen={isOpen}
      close={handleCancel}
      variant="basic"
      overlayStyle={styles.modalOverlayStyle}
    >
      <View nativeID="no-drag" style={styles.modalContent}>
        <View style={styles.header}>
          <Text variant="title2Weight">Dictation feedback</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.categoriesWrap}>
            {FEEDBACK_CATEGORIES.map((option) => {
              const isSelected = category === option;
              const isHovered = hoveredCategory === option;
              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    setCategory((prev) => (prev === option ? null : option))
                  }
                  onPointerEnter={() => setHoveredCategory(option)}
                  onPointerLeave={() => setHoveredCategory(null)}
                  style={[
                    styles.categoryChip(theme),
                    isSelected && styles.categoryChipSelected(theme),
                    isHovered && styles.categoryChipHover(theme),
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    variant="body2Regular"
                    color={isSelected ? "textBrand" : "textSecondary"}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            placeholder="Help us understand more..."
            value={reason}
            onValueChange={(value) =>
              setReason(value.slice(0, MAX_DICTATION_FEEDBACK_REASON_CHARS))
            }
            numberOfLines={4}
            variant="filled"
            style={styles.textArea}
          />

          <Text variant="body2Regular" color="textHint">
            {DISCLAIMER}
          </Text>
        </View>

        <Dialog.Actions>
          <Button variant="secondary" onPress={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSend} disabled={!canSend}>
            {isSubmitting ? "Sending..." : "Send"}
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
  body: {
    padding: 20,
    gap: 20,
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
    backgroundColor: theme.colors.interactivePrimaryDisabled,
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
