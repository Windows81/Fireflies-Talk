import { IconCopy } from "@/assets/svg/svgs.gen";
import { Button } from "@/components/Button";
import { Logger } from "@/logger";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { TALK_LANDING_LABEL, TALK_LANDING_URL } from "@/constants";
import { useAuth } from "@/features/auth";
import {
  describeTimeSaved,
  formatWordCount,
  getTimeSaved,
  type WordMilestone,
} from "@/hooks/dictationStats";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import {
  copyMilestoneImage,
  renderMilestoneShareImage,
} from "@/utils/milestoneShareImage";
import { milestoneShareUrl } from "@/utils/milestoneShareLink";
import { MilestoneCardCanvas } from "./MilestoneCardCanvas";
import { useEffect, useRef, useState, type FC } from "react";
import { View } from "react-native";

/** The card is painted at 1200×630; the preview is that same image. */
const CARD_RATIO = 1200 / 630;

/** How long the button stays on its result before going back to idle. */
const ACTION_FEEDBACK_MS = 2_500;

const SHARE_LABELS = {
  idle: "Share",
  done: "Copied",
  failed: "Couldn't copy",
} as const;

type ActionState = keyof typeof SHARE_LABELS;

const logger = new Logger("MilestoneShare");

/** "Enzo" out of "Enzo Hernandes" — the greeting wants a first name. */
const toFirstName = (name: string | undefined) => name?.trim().split(/\s+/)[0];

export interface MilestoneShareModalProps {
  /** The rung this card celebrates, already resolved from WORD_MILESTONES. */
  milestone: WordMilestone;
  totalWords: number;
  isOpen: boolean;
  close: () => void;
}

export const MilestoneShareModal: FC<MilestoneShareModalProps> = ({
  milestone,
  totalWords,
  isOpen,
  close,
}) => {
  const firstName = useAuth((s) => toFirstName(s.user?.name));
  const timeSaved = describeTimeSaved(totalWords);
  const words = formatWordCount(totalWords);

  const caption = `I've dictated ${words} words with Fireflies Talk, more than ${milestone.name}, and about ${timeSaved} saved against typing. ${milestoneShareUrl(TALK_LANDING_URL, milestone)}`;

  const [shareState, setShareState] = useState<ActionState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  // Sharing is copying: the card and its caption land on the clipboard, and
  // the user goes and pastes them wherever they were already headed.
  const handleShare = async () => {
    // The preview is a live canvas mid-animation; what gets shared is the
    // still, painted full size on the way out.
    const still = renderMilestoneShareImage({
      totalWords: words,
      milestone: milestone.name,
      timeSaved: getTimeSaved(totalWords),
      link: TALK_LANDING_LABEL,
    });
    // The bridge is ipc: a native clipboard that is busy or gone rejects, and
    // a canvas the browser refuses gives nothing back. Either way the button
    // has to say so rather than sit there reading "Share".
    const copied = still
      ? await copyMilestoneImage(still, caption).catch((error) => {
          logger.error("Failed to copy the milestone card", error);
          return false;
        })
      : false;

    tracker.track(TRACKING_EVENTS.DESKTOP_TALK_MILESTONE_SHARE_COPIED, {
      milestoneWords: milestone.words,
      success: copied,
    });
    setShareState(copied ? "done" : "failed");
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(
      () => setShareState("idle"),
      ACTION_FEEDBACK_MS,
    );
  };

  return (
    <Dialog.Root isOpen={isOpen} close={close} style={styles.dialog}>
      <View style={styles.content}>
        <Dialog.Close />

        <View style={styles.copy}>
          <Text variant="heading4Weight" color="textPrimary">
            {firstName ? `Congrats, ${firstName}! 🎉` : "Congrats! 🎉"}
          </Text>
          <Text variant="body1Regular" color="textSecondary">
            You have saved {timeSaved} and dictated more words than{" "}
            {milestone.name}.
          </Text>
        </View>

        <View
          style={styles.cardFrame}
          accessibilityLabel={`${words} words dictated, more than ${milestone.name}`}
        >
          <MilestoneCardCanvas
            totalWords={totalWords}
            milestone={milestone.name}
            link={TALK_LANDING_LABEL}
          />
        </View>

        <View style={styles.actions}>
          <Button variant="primary" onPress={handleShare} Icon={IconCopy}>
            {SHARE_LABELS[shareState]}
          </Button>
        </View>
      </View>
    </Dialog.Root>
  );
};

const styles = createStyles({
  // The dialog's own cap is 560 square, which this layout outgrows; without
  // this the card and the actions below it would be clipped away.
  dialog: {
    maxWidth: 560,
    maxHeight: 700,
    // Same rounding as the welcome banner, so the two read as one family.
    borderRadius: 12,
  },
  content: {
    alignSelf: "stretch",
  },
  copy: {
    gap: 4,
    // Clear of the close button in the corner.
    paddingRight: 44,
    paddingLeft: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  cardFrame: {
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: withAlpha(DESKTOP_THEME.grey100, 0.08),
    overflow: "hidden",
  },
  card: {
    width: "100%",
    aspectRatio: CARD_RATIO,
  },
  // Centred rather than right-aligned like Dialog.Actions: with one action and
  // centred copy above it, the middle is where the eye already is.
  actions: {
    alignItems: "center",
    padding: 20,
  },
});
