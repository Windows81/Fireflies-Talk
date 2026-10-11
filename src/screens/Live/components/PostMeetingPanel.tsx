import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { Text } from "@/components/Typography";
import { format, isValid, parseISO } from "date-fns";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TextStyle } from "react-native";
import { ActivityIndicator, Pressable, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createStyles, FontStyles, useTheme } from "@/styles";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { StreamingSection } from "./StreamingSection";
import { WritingNotesIndicator } from "./WritingNotesIndicator";
import { getInstantSummaryContent } from "@/utils/instant-summary-content";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/Input";
import { Config } from "@/constants";
import { IconArrowLeft, IconArrowUpRight, IconLink2 } from "@/assets/svg";
import { openURL } from "@/features/navigation";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { useIsDesktopNotepadEnabled } from "@/screens/DesktopNotepad/hooks/useIsDesktopNotepadEnabled";
import { openDesktopNotepadFromRecording } from "@/screens/DesktopNotepad/helpers/meeting";
import { useMeetingCapabilities } from "@/features/meeting/utils/permissions";
import {
  MEETING_PRIVACY_ICON_MAP,
  ShareMeetingDialog,
  useUpdateMeetingMutation,
} from "@/features/meeting";
import { toast } from "@/components/Toast";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { copyAsText } from "@/utils/clipboard";
import { useBooleanState } from "@/utils/states";
import { HoverTooltip } from "@/components/HoverTooltip";
import {
  DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { RecapEmailTooltip } from "./RecapEmailTooltip";

const titleEllipsisStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
} as TextStyle;

const GRADIENT_COLORS = [
  "rgba(0, 0, 0, 0.00)",
  "rgba(0, 0, 0, 0.80)",
  "#000000",
] as const;
const GRADIENT_LOCATIONS = [0, 0.9, 1] as const;
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 0, y: 1 };
const PENDING_TITLE_LOCK_TIMEOUT_MS = 15_000;

export const PostMeetingPanel: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const theme = useTheme();
  const {
    sectionContent,
    isSummaryProcessing,
    summaryError,
    completedSections,
  } = useLiveScreenContext();
  const { canEditMetadata } = useMeetingCapabilities(meeting);
  const [isOpenShare, openShare, closeShare] = useBooleanState();

  const recapPromptFlag = userLocalUserFlagsStore(
    (s) => s.flags[DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY],
  );
  const dismissRecapTooltip = useCallback(() => {
    setLocalUserFlag(DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY, true);
  }, []);

  const isOnMainWindow = isMainDesktopWindow();
  const isNotepadEnabled = useIsDesktopNotepadEnabled();

  const PrivacyIcon =
    MEETING_PRIVACY_ICON_MAP[meeting.notesPrivacy] ||
    MEETING_PRIVACY_ICON_MAP.owner;

  const hostName = meeting.organizer?.name || meeting.organizerEmail;
  const start =
    typeof meeting.startTime === "string"
      ? parseISO(meeting.startTime)
      : new Date(meeting.startTime);
  const formattedTime = isValid(start) ? format(start, "h:mm a") : "";

  const [editTitle, setEditTitle] = useState(meeting.title || "");
  const isTitleDirtyRef = useRef(false);
  const pendingSubmittedTitleRef = useRef<string | null>(null);
  const pendingTitleLockTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const latestMeetingTitleRef = useRef(meeting.title || "");
  const latestEditTitleRef = useRef(editTitle);

  const clearPendingTitleLockTimeout = useCallback(() => {
    if (pendingTitleLockTimeoutRef.current) {
      clearTimeout(pendingTitleLockTimeoutRef.current);
      pendingTitleLockTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestMeetingTitleRef.current = meeting.title || "";
  }, [meeting.title]);

  useEffect(() => {
    latestEditTitleRef.current = editTitle;
  }, [editTitle]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setEditTitle(value);
      isTitleDirtyRef.current = value !== meeting.title;
      pendingSubmittedTitleRef.current = null;
      clearPendingTitleLockTimeout();
    },
    [clearPendingTitleLockTimeout, meeting.title],
  );
  useEffect(() => {
    const pendingTitle = pendingSubmittedTitleRef.current;

    if (pendingTitle) {
      // Ignore stale meeting refetches while waiting for the submitted title
      // to roundtrip through the backend and cache updates.
      if (meeting.title === pendingTitle) {
        clearPendingTitleLockTimeout();
        pendingSubmittedTitleRef.current = null;
        isTitleDirtyRef.current = false;
        setEditTitle(meeting.title || "");
      }
      return;
    }

    if (!isTitleDirtyRef.current) {
      setEditTitle(meeting.title || "");
    }
  }, [clearPendingTitleLockTimeout, meeting.title]);

  useEffect(() => {
    return () => {
      clearPendingTitleLockTimeout();
    };
  }, [clearPendingTitleLockTimeout]);
  const updateMeeting = useUpdateMeetingMutation();

  const submitTitle = useCallback(() => {
    const trimmed = editTitle.trim();
    const currentTitle = meeting.title || "";
    if (!trimmed.length) {
      setEditTitle(currentTitle);
      isTitleDirtyRef.current = false;
      pendingSubmittedTitleRef.current = null;
      clearPendingTitleLockTimeout();
      return;
    }

    if (trimmed === currentTitle) {
      isTitleDirtyRef.current = false;
      pendingSubmittedTitleRef.current = null;
      clearPendingTitleLockTimeout();
      return;
    }

    pendingSubmittedTitleRef.current = trimmed;
    isTitleDirtyRef.current = true;
    clearPendingTitleLockTimeout();
    pendingTitleLockTimeoutRef.current = setTimeout(() => {
      if (pendingSubmittedTitleRef.current !== trimmed) return;
      if (latestEditTitleRef.current.trim() !== trimmed) return;
      pendingSubmittedTitleRef.current = null;
      isTitleDirtyRef.current = false;
      setEditTitle(latestMeetingTitleRef.current);
    }, PENDING_TITLE_LOCK_TIMEOUT_MS);

    setEditTitle(trimmed);
    if (trimmed.length && trimmed !== meeting.title) {
      updateMeeting({ id: meeting.id, title: trimmed });
      toast({ type: "success", message: "Meeting title updated" });
      tracker.track(TRACKING_EVENTS.CALL_RECORD_TITLE_EDITED, {
        meetingId: meeting.id,
        source: "instant_summary",
      });
    }
  }, [
    clearPendingTitleLockTimeout,
    editTitle,
    meeting.id,
    meeting.title,
    updateMeeting,
  ]);

  const handleViewFullMeeting = useCallback(() => {
    if (isNotepadEnabled) {
      void openDesktopNotepadFromRecording(meeting.id);
      return;
    }

    const url = `${Config.DASHBOARD_URL}/view/${meeting.id}`;
    openURL(url, { newTab: true });
  }, [isNotepadEnabled, meeting.id]);

  const { content: summaryContent, isCompleted: isSummaryCompleted } =
    getInstantSummaryContent(sectionContent, completedSections);

  const hasContent = !!summaryContent && summaryContent.trim().length > 0;
  const showProcessingIndicator =
    isSummaryProcessing && !hasContent && !summaryError;

  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const handleStreamingComplete = useCallback(() => {
    setIsAnimationDone(true);
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.meetingTitleSection}>
        <Pressable
          onPress={() => {
            if (isOnMainWindow) {
              // If the live view was reparented to the main window,
              // detach the overlay to reveal the main app underneath
              window.electron?.liveView?.detachFromMain();
            } else {
              window.electron?.window.closeAndFocusMain();
            }
          }}
          accessibilityLabel="Back"
          accessibilityRole="button"
          style={styles.backButton}
        >
          <IconArrowLeft
            width={24}
            height={24}
            color={theme.colors.layerContrast}
          />
        </Pressable>
        <View style={styles.titleContainer}>
          {canEditMetadata ? (
            <TextInput
              value={editTitle}
              onValueChange={handleTitleChange}
              onBlur={submitTitle}
              onSubmitEditing={submitTitle}
              variant="underlined"
              textStyle={[FontStyles.heading5Weight, titleEllipsisStyle]}
              style={styles.titleInput}
            />
          ) : (
            <Text
              variant="heading5Weight"
              color="textSecondary"
              numberOfLines={1}
            >
              <HoverTooltip position="bottom" label="Rename">
                {editTitle}
              </HoverTooltip>
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text variant="body2Regular" color="textHint">
              {hostName}
            </Text>
            <View style={styles.dot(theme)} />
            <Text variant="body2Regular" color="textHint">
              {formattedTime}
            </Text>
          </View>
        </View>
        <View style={styles.buttonGroup}>
          <RecapEmailTooltip
            isVisible={isDesktop && recapPromptFlag === false}
            onDismiss={dismissRecapTooltip}
          >
            <HoverTooltip position="bottom" label="Share">
              <Button
                onPress={openShare}
                Icon={PrivacyIcon}
                variant="primary"
                size="xs"
                style={styles.buttonGroupLeft}
              >
                Share
              </Button>
            </HoverTooltip>
          </RecapEmailTooltip>
          <View style={styles.buttonGroupDivider(theme)} />
          <HoverTooltip position="bottom" label="Copy url">
            <Button
              Icon={IconLink2}
              onPress={() => {
                copyAsText(
                  `${Config.DASHBOARD_URL}/live/${meeting.id}?ref=desktop`,
                ).then(() => toast("Meeting link copied"));
              }}
              variant="primary"
              size="xs"
              style={styles.buttonGroupRight}
            />
          </HoverTooltip>
        </View>
        <ShareMeetingDialog
          meetingId={meeting.id}
          meeting={meeting}
          isOpen={isOpenShare}
          close={closeShare}
        />
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summarySection}>
          <View style={styles.summaryContent}>
            {showProcessingIndicator && <WritingNotesIndicator />}
            {summaryError && (
              <Text
                variant="body2Regular"
                color="textSecondary"
                style={styles.errorText}
              >
                {summaryError}
              </Text>
            )}
            {hasContent && !summaryError && summaryContent && (
              <StreamingSection
                content={summaryContent}
                meeting={meeting}
                isCompleted={isSummaryCompleted}
                onStreamingComplete={handleStreamingComplete}
              />
            )}
          </View>
        </View>
      </ScrollView>
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.buttonContainer}
      >
        <View style={styles.buttonWrapper}>
          {isSummaryProcessing ||
          (hasContent && !isAnimationDone && !summaryError) ? (
            <View style={styles.progressContainer(theme)}>
              <ActivityIndicator color={theme.colors.textPrimary} />
              <Text
                variant="body2Regular"
                color="textPrimary"
                style={styles.progressText}
              >
                {isSummaryProcessing
                  ? "Preparing your meeting summary..."
                  : "Generating summary..."}
              </Text>
            </View>
          ) : (
            <Button
              variant="primary"
              size="md"
              Icon={IconArrowUpRight}
              onPress={handleViewFullMeeting}
            >
              {isNotepadEnabled ? "Go to Meeting" : "View Full Meeting"}
            </Button>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  meetingTitleSection: {
    marginVertical: 32,
    marginLeft: 24,
    marginRight: isDesktop ? 24 : 24,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  backButton: {
    justifyContent: "center",
    height: 28,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  buttonGroupLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonGroupRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  buttonGroupDivider: (theme) => ({
    width: 1,
    alignSelf: "stretch",
    backgroundColor: theme.colors.commandContrastDisabled,
  }),
  titleInput: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: (theme) => ({
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.textSecondary,
  }),
  summarySection: {
    gap: 6,
    paddingHorizontal: isDesktop ? 64 : 24,
    width: "100%",
    alignItems: "center",
  },
  summaryContent: {
    width: "100%",
    maxWidth: 648,
  },
  errorText: {
    textAlign: "left",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: isDesktop ? 64 : 32,
    paddingBottom: 20,
    paddingTop: 20,
    alignItems: "center",
    zIndex: 1000,
  },
  buttonWrapper: {
    width: "60%",
    maxWidth: 648,
    marginBottom: isDesktop ? 50 : 30,
  },
  progressContainer: (theme) => ({
    width: "100%",
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.layerDefault,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
  }),
  progressText: {
    textAlign: "center",
  },
});
