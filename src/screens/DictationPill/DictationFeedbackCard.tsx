import { IconX } from "@/assets/svg";
import { createStyles, useTheme, type Theme } from "@/styles";
import { DICTATION_FEEDBACK_CARD_WIDTH as CARD_WIDTH } from "electron/src/dictation/dictation-pill-anchored-layout";
import type {
  DictationFeedbackAction,
  DictationPillSide,
} from "electron/src/types";
import { useState, type FC } from "react";
import { Pressable, View } from "react-native";
import { DictationPillCardSurface } from "./DictationPillCardSurface";
import { TalkFeedbackStepContent } from "./TalkFeedbackStepContent";
import { useTalkFeedbackForm } from "./useTalkFeedbackForm";
import {
  pillCardArrowPlacement as arrowPlacement,
  pillCardRootDirection as rootDirection,
} from "./dictationPillCardLayout";
import { feedbackCardHeight } from "./dictationFeedback";

const CLOSE_CHIP_SIZE = 20;

type Props = {
  side: DictationPillSide;
  onAction: (action: DictationFeedbackAction) => void;
};

/**
 * The two-step Talk feedback card anchored to the pill: a star rating first,
 * then the details step, then a short thank-you beat the main window ends —
 * it owns the offer's lifecycle, so the card never takes itself down. The
 * close chip means different things per step: on rating it walks away
 * (dismiss); on details it submits a non-empty comment before dismissing,
 * without a thanks beat.
 */
export const DictationFeedbackCard: FC<Props> = ({ side, onAction }) => {
  const theme = useTheme();
  const form = useTalkFeedbackForm();
  const [cardHovered, setCardHovered] = useState(false);
  const cardHeight = feedbackCardHeight(form.step, form.rating);

  // The X submits a non-empty details comment before dismissing.
  const onClose = () => {
    form.closeActions().forEach(onAction);
  };

  const arrow = <View pointerEvents="none" style={arrowPlacement(side)} />;

  return (
    <View style={[styles.root, rootDirection(side)]}>
      <DictationPillCardSurface
        side={side}
        width={CARD_WIDTH}
        height={cardHeight}
      />
      {(side === "top" || side === "left") && arrow}
      <View
        style={[styles.card, { height: cardHeight }]}
        onPointerEnter={() => setCardHovered(true)}
        onPointerLeave={() => setCardHovered(false)}
      >
        <TalkFeedbackStepContent form={form} onShare={onAction} />
        {cardHovered && form.step !== "thanks" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.close(theme)}
          >
            <IconX
              width={16}
              height={16}
              color={theme.colors.dictationTalkTeaserCloseIcon}
            />
          </Pressable>
        )}
      </View>
      {(side === "bottom" || side === "right") && arrow}
    </View>
  );
};

const styles = createStyles({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH,
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  close: (theme: Theme) => ({
    position: "absolute",
    top: -4,
    left: CARD_WIDTH - CLOSE_CHIP_SIZE + 3,
    width: CLOSE_CHIP_SIZE,
    height: CLOSE_CHIP_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: theme.colors.dictationTalkTeaserCloseChip,
  }),
});
