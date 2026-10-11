import { IconMessageCircle, IconX } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { DICTATION_FEEDBACK_THANKS_MS } from "@/features/dictation-feedback-nudge";
import {
  onDictationInAppText,
  setDictationInAppOwnership,
} from "@/hooks/dictationInAppCapture";
import { TalkFeedbackStepContent } from "@/screens/DictationPill/TalkFeedbackStepContent";
import { dictatedInsertion } from "@/screens/DictationPill/dictationFeedback";
import { useTalkFeedbackForm } from "@/screens/DictationPill/useTalkFeedbackForm";
import { useSubmitTalkFeedback } from "@/screens/MainDesktop/hooks/useSubmitTalkFeedback";
import { createStyles, useTheme, type Theme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { DictationFeedbackAction } from "electron/src/types";
import { useEffect, useEffectEvent, useRef, useState, type FC } from "react";
import { Pressable, View } from "react-native";
import type { TextInput as RNTextInput } from "react-native";

const SOURCE = "dictation_home";
const CLOSE_CHIP_SIZE = 20;

type CommentTextArea = RNTextInput & HTMLTextAreaElement;

export const DictationShareFeedbackButton: FC = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [windowFocused, setWindowFocused] = useState(
    () => typeof document === "undefined" || document.hasFocus(),
  );
  const thanksTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const commentRef = useRef<RNTextInput>(null);
  const form = useTalkFeedbackForm();
  const submitTalkFeedback = useSubmitTalkFeedback();
  const { isHovered, webHoverProps } = useWebHover();
  const listensForTalk = isOpen && form.step === "details";
  const capturesTalk = listensForTalk && windowFocused;

  const insertDictation = useEffectEvent((text: string) => {
    const commentInput = commentRef.current as CommentTextArea | null;
    if (commentInput && document.activeElement === commentInput) {
      const insertion = dictatedInsertion(
        commentInput.value.slice(0, commentInput.selectionStart),
        commentInput.value.slice(commentInput.selectionEnd),
        text,
      );
      if (insertion.length === 0) return;
      if (document.execCommand("insertText", false, insertion)) return;
    }
    form.setComment(form.comment + dictatedInsertion(form.comment, "", text));
    commentRef.current?.focus();
  });

  useEffect(() => {
    const electron = window.electron;
    const offFocus = electron?.onWindowFocus?.(() => setWindowFocused(true));
    const offBlur = electron?.onWindowBlur?.(() => setWindowFocused(false));
    return () => {
      offFocus?.();
      offBlur?.();
    };
  }, []);

  useEffect(() => {
    if (!listensForTalk) return;
    return onDictationInAppText(insertDictation);
  }, [listensForTalk]);

  useEffect(() => {
    if (!capturesTalk) return;
    setDictationInAppOwnership(true);
    return () => setDictationInAppOwnership(false);
  }, [capturesTalk]);

  const clearThanksTimer = () => {
    clearTimeout(thanksTimerRef.current);
    thanksTimerRef.current = undefined;
  };

  useEffect(
    () => () => {
      clearTimeout(thanksTimerRef.current);
    },
    [],
  );

  const trackSubmit = (action: DictationFeedbackAction) => {
    if (action.type !== "submit") return;
    submitTalkFeedback(action);
    tracker.track(TRACKING_EVENTS.DICTATION_FEEDBACK_SUBMITTED, {
      rating: action.rating,
      source: SOURCE,
    });
  };

  const close = () => {
    clearThanksTimer();
    const actions = form.closeActions();
    const submitted = actions.some((action) => action.type === "submit");
    actions.forEach((action) => {
      if (action.type === "submit") {
        trackSubmit(action);
      } else if (!submitted && form.step !== "thanks") {
        tracker.track(TRACKING_EVENTS.DICTATION_FEEDBACK_DISMISSED, {
          source: SOURCE,
        });
      }
    });
    setIsOpen(false);
  };

  const open = () => {
    clearThanksTimer();
    form.reset();
    tracker.track(TRACKING_EVENTS.DICTATION_FEEDBACK_OPENED);
    setIsOpen(true);
  };

  const share = (action: DictationFeedbackAction) => {
    trackSubmit(action);
    clearThanksTimer();
    thanksTimerRef.current = setTimeout(() => {
      thanksTimerRef.current = undefined;
      setIsOpen(false);
    }, DICTATION_FEEDBACK_THANKS_MS);
  };

  return (
    <>
      <Pressable
        onPress={open}
        style={[styles.button, isHovered && styles.buttonHover(theme)]}
        accessibilityRole="button"
        accessibilityLabel="Share feedback"
        {...webHoverProps}
      >
        <IconMessageCircle
          width={16}
          height={16}
          color={theme.colors.textMuted}
          strokeWidth={2}
        />
        <Text variant="body2Regular" color="textMuted">
          Share feedback
        </Text>
      </Pressable>
      <Dialog.Root
        isOpen={isOpen}
        close={close}
        variant="basic"
        style={styles.dialog(theme)}
      >
        <View nativeID="no-drag" style={styles.body}>
          {form.step !== "thanks" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              style={styles.close(theme)}
            >
              <IconX
                width={16}
                height={16}
                color={theme.colors.dictationTalkTeaserCloseIcon}
              />
            </Pressable>
          )}
          <TalkFeedbackStepContent
            form={form}
            onShare={share}
            fitThanksContent
            commentRef={commentRef}
            autoFocusComment
            showStarsOnDetails
          />
        </View>
      </Dialog.Root>
    </>
  );
};

const styles = createStyles({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  buttonHover: (theme: Theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  dialog: (theme: Theme) => ({
    width: 400,
    maxWidth: "90%",
    backgroundColor: theme.colors.dictationTalkTeaserSurface,
    borderColor: theme.colors.dictationTalkTeaserBorder,
    borderWidth: 1,
    borderRadius: 12,
  }),
  body: {
    position: "relative",
    alignItems: "flex-start",
    gap: 10,
    padding: 20,
  },
  close: (theme: Theme) => ({
    position: "absolute",
    top: 10,
    right: 10,
    width: CLOSE_CHIP_SIZE,
    height: CLOSE_CHIP_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: theme.colors.dictationTalkTeaserCloseChip,
  }),
});
