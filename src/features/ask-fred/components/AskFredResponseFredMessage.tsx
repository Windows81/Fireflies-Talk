import { IconCopy } from "@/assets/svg";
import { Button } from "@/components/Button";
import type { MarkdownStyle } from "@/components/Markdown";
import { Markdown, markdownToHtml } from "@/components/Markdown";
import { createStyles, useTheme, vars, type Theme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC, RefObject } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { useExternalLinkHandler } from "../helpers/external-link";
import { transformContent } from "../helpers/transform-content";
import { FredTyping } from "./FredTyping";
import { AskFredAnswerLoader } from "./AskFredAnswerLoader";
import { AskFredResponseBubble } from "./AskFredResponseBubble";
import { copyText, markdownify } from "./utils";
import { ASK_FRED_LOADING_ANSWER } from "../constants/config";

const getMarkdownStyle = (theme: Theme): Partial<MarkdownStyle> => ({
  body: {
    ...vars.typography.body2LongRegular,
    fontSize: 14,
  },
  em: {
    ...vars.typography.body2Regular,
    fontSize: 12,
  },
  strong: {
    ...vars.typography.body2Weight,
    fontSize: 14,
    lineHeight: 24,
  },
  list_item: {
    marginBottom: 4,
  },
  heading1: {
    ...vars.typography.heading4Weight,
    marginBottom: 10,
    marginTop: 16,
  },
  heading2: {
    ...vars.typography.heading5Weight,
    marginBottom: 10,
    marginTop: 16,
  },
  heading3: {
    ...vars.typography.title1Weight,
    marginBottom: 10,
    marginTop: 16,
  },
  heading4: {
    ...vars.typography.title2Weight,
    marginBottom: 10,
    marginTop: 16,
  },
  heading5: {
    ...vars.typography.title3Weight,
    marginBottom: 10,
    marginTop: 16,
  },
  heading6: {
    ...vars.typography.title3Weight,
    marginBottom: 10,
    marginTop: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 8,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    flexDirection: "row",
  },
  th: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    padding: 5,
  },
  td: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    padding: 5,
  },
});

export const AskFredResponseFredMessage: FC<{
  answer: string | null | undefined;
  meeting: Pick<Meeting, "id">;
  containerRef?: RefObject<View | null>;
}> = ({ answer, meeting, containerRef }) => {
  const isLoadingAnswer = answer === ASK_FRED_LOADING_ANSWER;
  const theme = useTheme();
  const markdownStyle = useMemo(() => getMarkdownStyle(theme), [theme]);
  const markdownAnswer = useMemo(
    () =>
      answer && !isLoadingAnswer
        ? transformContent(meeting, markdownify(answer))
        : null,
    [answer, isLoadingAnswer, meeting],
  );

  const onLinkPress = useExternalLinkHandler(meeting);

  const onCopy = () => {
    if (!markdownAnswer) return;
    const html = markdownToHtml(markdownAnswer);
    copyText(html, true, containerRef);
    tracker.track(TRACKING_EVENTS.ASK_FRED_RESPONSE_COPIED, {
      meetingId: meeting.id,
    });
  };

  return (
    <View style={styles.answerWrapper}>
      <View style={styles.col}>
        <AskFredResponseBubble>
          {markdownAnswer ? (
            <Markdown
              color="textPrimary"
              onLinkPress={onLinkPress}
              style={markdownStyle}
            >
              {markdownAnswer}
            </Markdown>
          ) : isLoadingAnswer ? (
            <AskFredAnswerLoader isLiveMeeting={false} />
          ) : (
            <View style={styles.answerTyping}>
              <FredTyping />
            </View>
          )}
        </AskFredResponseBubble>
        {markdownAnswer && (
          <View style={styles.row}>
            <Button
              Icon={() => (
                <IconCopy
                  width={16}
                  height={16}
                  color={theme.colors.commandNeutralDisabled}
                />
              )}
              aria-label="Copy answer"
              variant="transparentNeutral"
              size="xs"
              onPress={onCopy}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  answerWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginRight: "auto",
  },
  answerTyping: {
    height: 32,
    flex: 0,
  },
  col: {
    flex: 1,
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
