import { IconTalkBannerReplyArrow } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";
import { GmailIcon } from "../DictationOnboarding/components/GmailIcon";
import { TALK_DEMO_EMAIL } from "./talkIntroDemoCopy";
import { TalkIntroReveal } from "./TalkIntroReveal";

interface TalkIntroEmailSceneProps {
  /** 1 once the thread header is up, 2 once the reply has landed. */
  revealed: number;
}

/** An email reply that was spoken into the thread, not typed. */
export const TalkIntroEmailScene: FC<TalkIntroEmailSceneProps> = ({
  revealed,
}) => (
  <>
    {revealed >= 1 && (
      <TalkIntroReveal style={styles.header}>
        <IconTalkBannerReplyArrow width={12} height={12} />
        <Text variant="body3Regular" style={styles.subject}>
          {TALK_DEMO_EMAIL.subject}
        </Text>
      </TalkIntroReveal>
    )}
    {revealed >= 2 && (
      <TalkIntroReveal style={styles.reply}>
        {TALK_DEMO_EMAIL.reply.map((paragraph) => (
          <View key={paragraph[0]}>
            {paragraph.map((line) => (
              <Text key={line} variant="body3Regular" style={styles.replyText}>
                {line}
              </Text>
            ))}
          </View>
        ))}
      </TalkIntroReveal>
    )}
    <View style={styles.app}>
      <GmailIcon size={20} />
    </View>
  </>
);

const styles = createStyles({
  header: {
    position: "absolute",
    top: 36,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  subject: {
    color: withAlpha(DESKTOP_THEME.grey100, 0.7),
  },
  reply: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    width: 225,
    padding: 12,
    gap: 4,
    borderRadius: 12,
    backgroundColor: withAlpha(DESKTOP_THEME.grey100, 0.08),
    boxShadow: `inset 0px 4px 4px 0px ${withAlpha(DESKTOP_THEME.grey100, 0.04)}`,
  },
  replyText: {
    color: withAlpha(DESKTOP_THEME.grey100, 0.8),
  },
  app: {
    position: "absolute",
    right: 56,
    top: 16,
  },
});
