import { IconGmail, IconLogo, IconOutlook } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, type Theme } from "@/styles";
import {
  DICTATION_EMAIL_ASSISTANT_CARD_HEIGHT as CARD_HEIGHT,
  DICTATION_EMAIL_ASSISTANT_CARD_WIDTH as CARD_WIDTH,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type {
  DictationEmailAssistantProvider,
  DictationPillSide,
} from "electron/src/types";
import { useState, type FC } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { DictationPillCardButton } from "./DictationPillCardButton";
import { DictationPillCardCloseChip } from "./DictationPillCardCloseChip";
import { DictationPillCardSurface } from "./DictationPillCardSurface";
import {
  pillCardArrowPlacement as arrowPlacement,
  pillCardRootDirection as rootDirection,
} from "./dictationPillCardLayout";

interface EmailAssistantBadgeProps {
  provider: DictationEmailAssistantProvider;
}

interface DictationEmailAssistantCardProps {
  side: DictationPillSide;
  provider: DictationEmailAssistantProvider;
  onConnect: () => void;
  onClose: () => void;
}

// Each mark's box is sized so its drawn glyph sits at the Fireflies mark's
// 8px height: Gmail's art is wide and short, Outlook's nearly fills its box.
const PROVIDER_MARKS = {
  gmail: { Mark: IconGmail, size: 12 },
  outlook: { Mark: IconOutlook, size: 10 },
} satisfies Record<
  DictationEmailAssistantProvider,
  { Mark: FC<SvgProps>; size: number }
>;

const CONNECT_LABELS = {
  gmail: "Connect Gmail",
  outlook: "Connect Outlook",
} satisfies Record<DictationEmailAssistantProvider, string>;

const EmailAssistantBadge: FC<EmailAssistantBadgeProps> = ({ provider }) => {
  const theme = useTheme();
  const { Mark, size } = PROVIDER_MARKS[provider];

  return (
    <View style={styles.badge(theme)} accessible={false}>
      <IconLogo width={8} height={8} />
      <Mark width={size} height={size} />
    </View>
  );
};

export const DictationEmailAssistantCard: FC<
  DictationEmailAssistantCardProps
> = ({ side, provider, onConnect, onClose }) => {
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
          <EmailAssistantBadge provider={provider} />
          <View style={styles.text}>
            <Text
              variant="body3Weight"
              color="dictationTalkTeaserTitle"
              numberOfLines={1}
            >
              Let Fireflies handle your inbox
            </Text>
            <Text
              variant="body3Regular"
              color="dictationTalkTeaserBody"
              numberOfLines={1}
            >
              Organize your inbox and draft replies for you.
            </Text>
          </View>
        </View>
        <DictationPillCardButton onPress={onConnect}>
          {CONNECT_LABELS[provider]}
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
