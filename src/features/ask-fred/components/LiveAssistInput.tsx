import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TextInput as TextInputType } from "react-native";
import type { ViewStyle } from "react-native";
import {
  TextInput as RNTextInput,
  View,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { createStyles, useTheme, vars } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useAssistThread } from "../providers/AssistThreadContext";
import { useBilling } from "@/features/billing";
import { Logger } from "@/logger";
import {
  ASKFRED_SUGGESTION_SOURCE,
  ASK_FRED_REF_SOURCE,
  getInitialTemplatesToShow,
} from "../constants/config";
import { IconFred, IconArrowUp } from "@/assets/svg";
import { IconButton } from "@/components/Button";
import { isDesktop } from "@/utils/device";
import { isLiveMeeting } from "@/features/live";
import { useBooleanState } from "@/utils/states";
import { useAppTemplatesAndSettings } from "src/hooks/useAppTemplates";
import type { AppSettings, AppTemplate } from "@/graphql";
import {
  AppTemplatesPopoverContent,
  filterTemplatesByQuery,
  getSlashFilterQuery,
} from "./AppTemplatesPopoverContent";

const logger = new Logger("LiveAssistInput");

const PADDING_VERTICAL = 8;
const LINE_HEIGHT = 20;
const SINGLE_LINE_HEIGHT = LINE_HEIGHT + PADDING_VERTICAL * 2;
const DEFAULT_MAX_LINES = 5;

const getMaxHeight = (maxLines: number) =>
  maxLines * LINE_HEIGHT + PADDING_VERTICAL * 2;

export const IconFredBig: FC = () => {
  return <IconFred width={28} height={28} />;
};

const PLACEHOLDER_TEXTS = ["Ask Fred anything", "Type '/' to use AI Skills"];

const DROPDOWN_GUTTER = 8;
const DROPDOWN_MAX_HEIGHT = 320;

const dropdownStyles = createStyles({
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  } as unknown as ViewStyle,
  panel: (theme) => ({
    position: "absolute",
    width: "100%",
    maxHeight: DROPDOWN_MAX_HEIGHT,
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    overflow: "hidden",
    ...vars.elevations[2],
  }),
});

export const LiveAssistInput: FC<{
  meeting: Meeting;
  maxLines?: number;
  compact?: boolean;
  placeholder?: string;
  /**
   * Called when a user without prompt entitlement presses the field, so the
   * surface can point them at its paywall instead of failing silently.
   */
  onBlockedPress?: () => void;
}> = ({
  meeting,
  maxLines = DEFAULT_MAX_LINES,
  compact = false,
  placeholder,
  onBlockedPress,
}) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [inputHeight, setInputHeight] = useState(SINGLE_LINE_HEIGHT);
  const [hover, setHoverTrue, setHoverFalse] = useBooleanState();
  const [focused, setFocusedTrue, setFocusedFalse] = useBooleanState();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<TextInputType>(null);
  const triggerRef = useRef<View>(null);
  const { aiApps, loading: templatesLoading } = useAppTemplatesAndSettings();
  const { askFred, isAnyAssistLoading, hasOptimisticMessage } =
    useAssistThread();
  const { isAllowedToUsePrompts } = useBilling();

  const filterQuery = useMemo(() => getSlashFilterQuery(input), [input]);

  const defaultTemplates = useMemo(() => {
    const mapById = aiApps.reduce(
      (acc, template) => {
        acc[template.id] = template;
        return acc;
      },
      {} as Record<string, AppTemplate | AppSettings>,
    );

    return getInitialTemplatesToShow()
      .map((title: string) => mapById[title] ?? null)
      .filter(Boolean);
  }, [aiApps]);

  const filteredAIApps = useMemo(
    () =>
      filterQuery
        ? filterTemplatesByQuery(aiApps, filterQuery)
        : defaultTemplates,
    [aiApps, defaultTemplates, filterQuery],
  );

  const handleTextChange = useCallback((text: string) => {
    setInput(text);
    if (!text.trim()) {
      setInputHeight(SINGLE_LINE_HEIGHT);
    }
    if (text.trim().startsWith("/")) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
    }
  }, []);

  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const { height } = event.nativeEvent.contentSize;
      // Clamp height between single line and max lines
      const clampedHeight = Math.min(
        Math.max(height, SINGLE_LINE_HEIGHT),
        getMaxHeight(maxLines),
      );
      setInputHeight(clampedHeight);
    },
    [maxLines],
  );

  const onSubmit = useCallback(async () => {
    if (isAnyAssistLoading || !isAllowedToUsePrompts) return;
    const query = input.trim();
    if (!query) return;

    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId: meeting.id,
      queryLength: query.length,
      liveAssist: true,
      isSuggestedPrompt: false,
      screen: isLiveMeeting(meeting) ? "live" : "instant_summary",
    });

    try {
      // Dismiss keyboard first to avoid focus issues
      Keyboard.dismiss();

      // Clear input immediately before the async operation
      setInput("");
      // Reset height to single line
      setInputHeight(SINGLE_LINE_HEIGHT);

      // Then submit the question
      await askFred(
        query,
        ASKFRED_SUGGESTION_SOURCE.ASSIST_FRED_PANEL_MANUAL_INPUT,
        ASK_FRED_REF_SOURCE.ASSIST_AGENT_SOURCE,
      );
    } catch (error) {
      logger.error("Failed to submit Live Assist question:", { error });
    }
  }, [isAnyAssistLoading, isAllowedToUsePrompts, input, meeting, askFred]);

  const onButtonSubmit = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  const onSelectTemplate = useCallback(
    async (template: AppTemplate | AppSettings) => {
      const query = template.prompt?.user
        ? `${template.title} \n\n [TEMPLATE_DESCRIPTION_START] ${template?.description ?? ""} [TEMPLATE_DESCRIPTION_END] \n\n [TEMPLATE_START] ${template.prompt.user} [TEMPLATE_END] \n\n`
        : template.title;

      if (isAnyAssistLoading || !isAllowedToUsePrompts) return;

      tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
        meetingId: meeting.id,
        queryLength: query.length,
        aiAppTemplate: true,
        screen: isLiveMeeting(meeting) ? "live" : "instant_summary",
      });

      try {
        Keyboard.dismiss();
        setInput("");
        setInputHeight(SINGLE_LINE_HEIGHT);
        setPopoverOpen(false);

        await askFred(
          query,
          ASKFRED_SUGGESTION_SOURCE.ASSIST_FRED_PANEL_AI_APPS_SUGGESTION,
          ASK_FRED_REF_SOURCE.ASSIST_AGENT_SOURCE,
        );
      } catch (error) {
        logger.error("Failed to submit template to Live Assist:", { error });
      } finally {
        inputRef.current?.focus();
      }
    },
    [isAnyAssistLoading, isAllowedToUsePrompts, meeting, askFred],
  );

  const preventDefault = useCallback(
    (event: { nativeEvent: { key: string; shiftKey?: boolean } }) => {
      if (Platform.OS === "web") {
        (event as unknown as { preventDefault: () => void }).preventDefault?.();
      }
    },
    [],
  );

  const handleKeyPress = useCallback(
    (event: { nativeEvent: { key: string; shiftKey?: boolean } }) => {
      const key = event.nativeEvent.key;

      if (popoverOpen && filteredAIApps.length > 0) {
        if (key === "ArrowDown") {
          preventDefault(event);
          setSelectedIndex((i) => Math.min(i + 1, filteredAIApps.length - 1));
          return;
        }
        if (key === "ArrowUp") {
          preventDefault(event);
          setSelectedIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (key === "Enter" && !event.nativeEvent.shiftKey) {
          preventDefault(event);
          const template = filteredAIApps[selectedIndex];
          if (template) {
            onSelectTemplate(template);
          }
          return;
        }
      }

      if (key === "Enter" && !event.nativeEvent.shiftKey) {
        preventDefault(event);
        onSubmit();
      }
    },
    [
      popoverOpen,
      filteredAIApps,
      selectedIndex,
      onSelectTemplate,
      onSubmit,
      preventDefault,
    ],
  );

  useEffect(() => {
    if (popoverOpen) {
      setSelectedIndex(0);
    }
  }, [popoverOpen]);

  useEffect(() => {
    if (popoverOpen && filteredAIApps.length > 0) {
      setSelectedIndex((i) => Math.min(i, filteredAIApps.length - 1));
    }
  }, [popoverOpen, filteredAIApps.length]);

  useEffect(() => {
    if (!popoverOpen) return;
    const cleanup = window.electron?.onWindowBlur?.(() => {
      setPopoverOpen(false);
    });
    return cleanup;
  }, [popoverOpen]);

  // Web: capture Arrow keys via keydown (onKeyPress often doesn't fire for them)
  const filteredTemplatesRef = useRef(filteredAIApps);
  filteredTemplatesRef.current = filteredAIApps;

  useEffect(() => {
    if (Platform.OS !== "web" || !popoverOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const list = filteredTemplatesRef.current;
      if (list.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, list.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [popoverOpen]);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (hasOptimisticMessage) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasOptimisticMessage]);

  const isPaywalled = !isAllowedToUsePrompts;
  const disabled = isAnyAssistLoading || isPaywalled;
  const showSubmitButton = focused || Boolean(input.trim());

  return (
    <View
      style={[styles.inputContainer, compact && styles.inputContainerCompact]}
    >
      <View style={styles.inputWrapper}>
        {popoverOpen && (
          <>
            <Pressable
              style={dropdownStyles.backdrop as ViewStyle}
              onPress={() => setPopoverOpen(false)}
              nativeID="no-drag"
            />
            <View
              style={[
                (
                  dropdownStyles.panel as (
                    t: ReturnType<typeof useTheme>,
                  ) => ViewStyle
                )(theme),
                {
                  bottom: "100%",
                  marginBottom: DROPDOWN_GUTTER,
                  zIndex: 1001,
                },
              ]}
            >
              <AppTemplatesPopoverContent
                key={filterQuery}
                onSelectTemplate={onSelectTemplate}
                onClose={() => setPopoverOpen(false)}
                filteredAIApps={filteredAIApps}
                selectedIndex={selectedIndex}
                loading={templatesLoading}
              />
            </View>
          </>
        )}
        <View
          ref={triggerRef}
          collapsable={false}
          style={[
            styles.inputRoot(theme),
            compact && styles.inputRootCompact,
            hover && styles.inputRootHover(theme),
            focused && styles.inputRootFocused(theme),
          ]}
        >
          <RNTextInput
            ref={inputRef}
            placeholder={
              hasOptimisticMessage
                ? "Getting response..."
                : (placeholder ?? PLACEHOLDER_TEXTS[placeholderIndex])
            }
            placeholderTextColor={theme.colors.textHint}
            value={input}
            onChangeText={handleTextChange}
            onContentSizeChange={handleContentSizeChange}
            onSubmitEditing={onSubmit}
            onKeyPress={handleKeyPress}
            onPointerEnter={setHoverTrue}
            onPointerLeave={setHoverFalse}
            onFocus={setFocusedTrue}
            onBlur={setFocusedFalse}
            readOnly={disabled}
            selectTextOnFocus={!disabled}
            returnKeyType="send"
            autoFocus={isAllowedToUsePrompts && !isAnyAssistLoading}
            multiline
            textAlignVertical="center"
            cursorColor={theme.colors.layerContrast}
            style={[
              styles.input(theme),
              disabled && styles.inputDisabled(theme),
              { height: inputHeight },
            ]}
          />
          <View style={styles.trailing}>
            {showSubmitButton && (
              <IconButton
                Icon={IconArrowUp}
                size="sm"
                label="Submit"
                disabled={disabled || !input.trim()}
                onPress={onButtonSubmit}
              />
            )}
          </View>
          {isPaywalled && onBlockedPress && (
            // The field can't take focus while gated, so catch presses across
            // the whole row rather than letting them fall through to nothing.
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onBlockedPress}
              accessibilityRole="button"
              accessibilityLabel="Upgrade to use AskFred"
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  inputContainer: {
    padding: 20,
  },
  inputContainerCompact: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
  },
  inputWrapper: {
    position: "relative",
  },
  inputRoot: (theme) => ({
    borderRadius: isDesktop ? 8 : 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingLeft: 2,
    paddingRight: 4,
    paddingVertical: 8,
    backgroundColor: isDesktop
      ? theme.colors.interactiveSecondaryDisabled
      : theme.colors.interactiveNeutral1Default,
    borderColor: theme.colors.borderStaticDefault,
  }),
  inputRootCompact: {
    paddingVertical: 2,
  },
  inputRootHover: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
  }),
  inputRootFocused: (theme) => ({
    borderColor: theme.colors.borderStaticBrand,
  }),
  leading: {
    paddingLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  triggerButton: (theme) => ({
    padding: 6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.borderStaticTransparent,
  }),
  triggerButtonPressed: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
  }),
  trailing: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginLeft: 8,
    marginBottom: 2,
  },
  input: (theme) => ({
    color: theme.colors.textSecondary,
    flex: 1,
    ...(Platform.OS === "web" && {
      outline: "none",
    }),
    ...vars.typography.body2Regular,
    paddingVertical: PADDING_VERTICAL,
    paddingHorizontal: 8,
    lineHeight: 20,
  }),
  inputDisabled: (theme) => ({
    color: theme.colors.textDisabled,
  }),
});
