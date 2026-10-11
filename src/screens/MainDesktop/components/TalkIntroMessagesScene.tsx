import { IconSlack } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";
import { TALK_DEMO_MESSAGES } from "./talkIntroDemoCopy";
import { TalkIntroReveal } from "./TalkIntroReveal";

type BubbleTone = "received" | "sent";

const THREAD: readonly { tone: BubbleTone; text: string }[] = [
  { tone: "received", text: TALK_DEMO_MESSAGES.question1 },
  { tone: "sent", text: TALK_DEMO_MESSAGES.reply1 },
  { tone: "received", text: TALK_DEMO_MESSAGES.question2 },
  { tone: "sent", text: TALK_DEMO_MESSAGES.reply2 },
];

interface TalkIntroBubbleProps {
  tone: BubbleTone;
  children: string;
}

interface TalkIntroMessagesSceneProps {
  /** How many bubbles of the thread have landed so far. */
  revealed: number;
}

const TalkIntroBubble: FC<TalkIntroBubbleProps> = ({ tone, children }) => (
  <TalkIntroReveal style={[styles.bubble, styles[tone]]}>
    <Text variant="body3Regular" style={styles.bubbleText} numberOfLines={1}>
      {children}
    </Text>
  </TalkIntroReveal>
);

/** A chat thread where every sent bubble was spoken, not typed. */
export const TalkIntroMessagesScene: FC<TalkIntroMessagesSceneProps> = ({
  revealed,
}) => (
  <>
    <View style={styles.thread}>
      {THREAD.slice(0, revealed).map(({ tone, text }) => (
        <TalkIntroBubble key={text} tone={tone}>
          {text}
        </TalkIntroBubble>
      ))}
    </View>
    <View style={styles.app}>
      <IconSlack width={20} height={20} />
    </View>
  </>
);

const styles = createStyles({
  // Figma sets the column 68px into the 360px panel; centered it lands at 70.
  thread: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    width: 219,
    gap: 14,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 36,
  },
  bubbleText: {
    color: withAlpha(DESKTOP_THEME.grey100, 0.9),
  },
  received: {
    alignSelf: "flex-start",
    backgroundColor: withAlpha(DESKTOP_THEME.grey100, 0.1),
    boxShadow: `inset 0px 4px 4px 0px ${withAlpha(DESKTOP_THEME.grey100, 0.05)}`,
  },
  sent: {
    alignSelf: "flex-end",
    backgroundColor: DESKTOP_THEME.talkBannerReplyBubble,
    boxShadow: `inset 0px 4px 4px 0px ${withAlpha(DESKTOP_THEME.grey100, 0.25)}`,
  },
  app: {
    position: "absolute",
    right: 56,
    top: 16,
  },
});
