import { createStyles } from "@/styles";
import { TALK_FEEDBACK_PROPS } from "@/screens/MainDesktop/components/talkFeedback";
import type { DictationFeedbackAction } from "electron/src/types";
import type { FC, Ref } from "react";
import { View } from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import { Text } from "@/components/Typography";
import { DictationFeedbackDetails } from "./DictationFeedbackDetails";
import { DictationFeedbackStars } from "./DictationFeedbackStars";
import type { TalkFeedbackForm } from "./useTalkFeedbackForm";

type Props = {
  form: TalkFeedbackForm;
  onShare: (action: DictationFeedbackAction) => void;
  fitThanksContent?: boolean;
  commentRef?: Ref<RNTextInput>;
  autoFocusComment?: boolean;
  showStarsOnDetails?: boolean;
};

export const TalkFeedbackStepContent: FC<Props> = ({
  form,
  onShare,
  fitThanksContent = false,
  commentRef,
  autoFocusComment,
  showStarsOnDetails = false,
}) => (
  <>
    {form.step === "rating" && (
      <>
        <View style={styles.copy}>
          <Text variant="body3Weight" color="dictationTalkTeaserTitle">
            {TALK_FEEDBACK_PROPS.title}
          </Text>
          <Text variant="body3Regular" color="dictationTalkTeaserBody">
            How happy are you so far?
          </Text>
        </View>
        <DictationFeedbackStars onRate={form.rate} />
      </>
    )}
    {form.step === "details" && (
      <>
        {showStarsOnDetails && (
          <DictationFeedbackStars rating={form.rating} onRate={form.rate} />
        )}
        <DictationFeedbackDetails
          rating={form.rating}
          comment={form.comment}
          categories={form.categories}
          canQuote={form.canQuote}
          onCommentChange={form.setComment}
          onToggleCategory={form.toggleCategory}
          onCanQuoteChange={form.setCanQuote}
          onShare={() => onShare(form.share())}
          commentRef={commentRef}
          autoFocusComment={autoFocusComment}
        />
      </>
    )}
    {form.step === "thanks" && (
      <View
        style={[styles.thanks, fitThanksContent && styles.thanksFitContent]}
      >
        <Text variant="body3Weight" color="dictationTalkTeaserTitle">
          Thanks for your feedback!
        </Text>
      </View>
    )}
  </>
);

const styles = createStyles({
  copy: {
    gap: 2,
  },
  thanks: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  thanksFitContent: {
    flex: 0,
    minHeight: 28,
  },
});
