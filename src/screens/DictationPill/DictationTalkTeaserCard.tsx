import talkTeaserBadge from "@/assets/images/talk_teaser_badge.png";
import talkTeaserBadge2x from "@/assets/images/talk_teaser_badge_2x.png";
import talkTeaserBadge3x from "@/assets/images/talk_teaser_badge_3x.png";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import {
  DICTATION_TALK_TEASER_CARD_HEIGHT as CARD_HEIGHT,
  DICTATION_TALK_TEASER_CARD_WIDTH as CARD_WIDTH,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type {
  DictationPillSide,
  DictationTeaserContent,
} from "electron/src/types";
import { useState, type FC } from "react";
import { Image, useWindowDimensions, View } from "react-native";
import { DictationPillCardButton } from "./DictationPillCardButton";
import { DictationPillCardCloseChip } from "./DictationPillCardCloseChip";
import { DictationPillCardSurface } from "./DictationPillCardSurface";
import {
  pillCardArrowPlacement as arrowPlacement,
  pillCardRootDirection as rootDirection,
} from "./dictationPillCardLayout";
import { dictationTeaserCopy } from "./dictationTeaserCopy";

type Props = {
  side: DictationPillSide;
  content: DictationTeaserContent;
  onTry: () => void;
  onClose: () => void;
};

/**
 * The "Try Talk" card that introduces Talk beside the resting pill. Laid out
 * along the axis facing the pill so the arrow always hangs off the edge
 * nearest it; the close chip only surfaces while the card is hovered.
 */
export const DictationTalkTeaserCard: FC<Props> = ({
  side,
  content,
  onTry,
  onClose,
}) => {
  const copy = dictationTeaserCopy(content);
  // Not a Pressable: its hover ends the moment a nested Pressable (Try, the
  // chip) takes the pointer, which would pull the chip out from under a click.
  const [cardHovered, setCardHovered] = useState(false);
  const { scale } = useWindowDimensions();
  // Expo web assets have fixed URIs, so density selection must be explicit.
  const badgeSource =
    scale > 2
      ? talkTeaserBadge3x
      : scale > 1
        ? talkTeaserBadge2x
        : talkTeaserBadge;
  const arrow = <View pointerEvents="none" style={arrowPlacement(side)} />;
  const nudge = !!copy.emoji;

  return (
    <View style={[styles.root, rootDirection(side)]}>
      <DictationPillCardSurface
        side={side}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
      />
      {(side === "top" || side === "left") && arrow}
      <View
        style={styles.card}
        onPointerEnter={() => setCardHovered(true)}
        onPointerLeave={() => setCardHovered(false)}
      >
        <View style={styles.copy}>
          {!nudge && (
            <Image
              source={badgeSource}
              style={styles.badge}
              resizeMode="contain"
              accessible={false}
            />
          )}
          <View style={styles.text}>
            <View style={styles.titleRow}>
              {copy.emoji && (
                <Text variant="body3Weight" style={styles.emoji}>
                  {copy.emoji}
                </Text>
              )}
              <Text
                variant="body3Weight"
                color="dictationTalkTeaserTitle"
                numberOfLines={1}
              >
                {copy.title}
              </Text>
            </View>
            <Text
              variant="body3Regular"
              color="dictationTalkTeaserBody"
              numberOfLines={nudge ? 2 : 1}
            >
              {copy.body}
            </Text>
          </View>
        </View>
        <DictationPillCardButton onPress={onTry}>
          {copy.action}
        </DictationPillCardButton>
        {cardHovered && (
          <DictationPillCardCloseChip
            cardWidth={CARD_WIDTH}
            onPress={onClose}
          />
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
    height: CARD_HEIGHT,
    alignItems: "flex-start",
    gap: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  copy: {
    flex: 1,
    width: "100%",
    gap: 6,
  },
  text: {
    gap: 2,
    flexShrink: 0,
  },
  badge: {
    width: 41,
    height: 18,
    flexShrink: 0,
  },
  // Sits on the title's line, in place of the badge the introduction shows.
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emoji: {
    flexShrink: 0,
  },
});
