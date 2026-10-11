import { IconLogo, IconSlack } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, type Theme } from "@/styles";
import {
  DICTATION_SLACK_ASSISTANT_CARD_HEIGHT as CARD_HEIGHT,
  DICTATION_SLACK_ASSISTANT_CARD_WIDTH as CARD_WIDTH,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type { DictationPillSide } from "electron/src/types";
import { useState, type FC } from "react";
import { View } from "react-native";
import { DictationPillCardButton } from "./DictationPillCardButton";
import { DictationPillCardCloseChip } from "./DictationPillCardCloseChip";
import { DictationPillCardSurface } from "./DictationPillCardSurface";
import {
  pillCardArrowPlacement as arrowPlacement,
  pillCardRootDirection as rootDirection,
} from "./dictationPillCardLayout";

interface DictationSlackAssistantCardProps {
  side: DictationPillSide;
  onConnect: () => void;
  onClose: () => void;
}

const SlackAssistantBadge: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.badge(theme)} accessible={false}>
      <IconLogo width={8} height={8} />
      <IconSlack width={10} height={10} />
    </View>
  );
};

export const DictationSlackAssistantCard: FC<
  DictationSlackAssistantCardProps
> = ({ side, onConnect, onClose }) => {
  // Not a Pressable, for the same reason as the teaser: a nested Pressable
  // taking the pointer would end its hover and pull the close chip away.
  const [cardHovered, setCardHovered] = useState(false);
  const arrow = <View pointerEvents="none" style={arrowPlacement(side)} />;

  const handlePointerEnter = () => setCardHovered(true);
  const handlePointerLeave = () => setCardHovered(false);

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
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <View style={styles.copy}>
          <SlackAssistantBadge />
          <View style={styles.text}>
            <Text
              variant="body3Weight"
              color="dictationTalkTeaserTitle"
              numberOfLines={1}
            >
              Bring Fireflies into Slack
            </Text>
            <Text
              variant="body3Regular"
              color="dictationTalkTeaserBody"
              numberOfLines={1}
            >
              Tag @ Fireflies for answers, insights and actions.
            </Text>
          </View>
        </View>
        <DictationPillCardButton onPress={onConnect}>
          Connect Slack
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
  badge: (theme: Theme) => ({
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 18,
    paddingHorizontal: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: theme.colors.dictationTalkTeaserBadgeBorder,
    backgroundColor: theme.colors.dictationTalkTeaserBadgeSurface,
  }),
});
