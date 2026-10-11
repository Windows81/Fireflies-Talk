import { useAuth } from "@/features/auth/store";
import { IconCopy } from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { markdownToHtml } from "@/components/Markdown";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { MeetingSummaryStatus } from "@firefliesai/mobile-ff.graphql-client";
import { createStyles, useTheme } from "@/styles";
import { copyAsHtml } from "@/utils/clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRowHover } from "../../hooks/useRowHover";
import { runOnJS, useSharedValue, withTiming } from "react-native-reanimated";
import {
  NOTEPAD_CONTENT_TOP_PADDING,
  NOTEPAD_HEADER_CONTENT_GAP,
  NOTEPAD_VIDEO_PEEK_OFFSET,
  SUMMARY_STALL_MS,
} from "../../constants";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import {
  hasPlayableMedia,
  isAudioOnly,
  isMeetingOwner,
} from "../../helpers/meeting";
import { getSummaryUnavailableReason } from "../../helpers/summaryStatus";
import { useDesktopNotepadSummary } from "../../hooks/useDesktopNotepadSummary";
import { useInstantSummaryPreview } from "../../hooks/useInstantSummaryPreview";
import { useSummaryProcessing } from "../../hooks/useSummaryProcessing";
import { useSummaryStallTimeout } from "../../hooks/useSummaryStallTimeout";
import { useSyncedPaneScroll } from "../../hooks/useSyncedPaneScroll";
import { FreeMeetingsPaywallPane } from "../FreeMeetingsPaywall/FreeMeetingsPaywallPane";
import { useFreeMeetingsPaywall } from "../FreeMeetingsPaywall/useFreeMeetingsPaywall";
import { NotepadMeetingHeader } from "../NotepadMeetingHeader";
import { NotepadTemplateSelector } from "../TemplateSelector/NotepadTemplateSelector";
import { NotepadInstantSummary } from "./NotepadInstantSummary";
import { PolishingPill } from "./PolishingPill";
import { SummaryProcessing } from "./SummaryProcessing";
import { SummaryReveal } from "./SummaryReveal";
import { SummarySection } from "./SummarySection";
import { SummaryStatusMessage } from "./SummaryStatusMessage";

// Duration of the "polishing → general summary" reveal (pill slides down while
// the general summary wipes into place). Deliberately slow so the transition
// from the quick summary to the general summary is easy to follow.
const REVEAL_MS = 5000;

const SUMMARY_TO_NOTES_GAP = 24;

export const NotepadSummary = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { meeting, fromRecording, mainTab, activeNotesView } =
    useDesktopNotepadContext();
  const { sections, loading, summaryStatus } =
    useDesktopNotepadSummary(meeting);
  const instantSummary = useInstantSummaryPreview(fromRecording);
  const { processing } = useSummaryProcessing(meeting.id, {
    detectOnMount: true,
    watchForProcessing: fromRecording,
  });
  const canEdit = isMeetingOwner(meeting, user);
  const { ref: notesRef, isHovered: isNotesHovered } = useRowHover();

  const onCopyAll = useCallback(() => {
    if (!sections.length) return;
    let html = "";
    sections.forEach((section) => {
      html += `<h1>${section.title}</h1>`;
      html += markdownToHtml(section.rawValue);
    });
    copyAsHtml(html).then(
      () => toast({ message: "Copied to clipboard" }),
      (error) =>
        toast({
          title: "Failed to copy",
          message: error.message,
          type: "error",
        }),
    );
  }, [sections]);

  const hasNotes = sections.length > 0;
  const isSummarySettled =
    summaryStatus === MeetingSummaryStatus.Processed ||
    summaryStatus === MeetingSummaryStatus.Failed ||
    summaryStatus === MeetingSummaryStatus.Skipped;
  const showGeneralSummary = hasNotes && isSummarySettled && !processing;
  // The instant summary is only a pre-first-summary preview. Once a general
  // summary exists (e.g. regenerating via a template change), show the loading
  // state instead of reverting to the instant summary.
  const instantSummaryContent =
    fromRecording && !hasNotes && instantSummary.hasContent
      ? instantSummary.content
      : null;
  const showInstantSummary = instantSummaryContent != null;
  const stalled = useSummaryStallTimeout(
    !isSummarySettled && !hasNotes,
    SUMMARY_STALL_MS,
  );
  // Terminal state: the summary will never arrive, so drop the loading UI
  // instead of leaving the user on an endless "Polishing your notes…".
  const unavailableReason =
    hasNotes || loading || processing
      ? null
      : (getSummaryUnavailableReason(meeting, summaryStatus) ??
        (stalled ? "stalled" : null));
  const showUnavailable = unavailableReason !== null;
  const showProcessingState =
    !showGeneralSummary &&
    !showInstantSummary &&
    !showUnavailable &&
    (processing ||
      loading ||
      summaryStatus === MeetingSummaryStatus.Processing ||
      instantSummary.isProcessing ||
      (fromRecording && !isSummarySettled));
  // Out of free meetings nothing will ever be transcribed, so the processing
  // skeleton would spin forever. Credits arriving flips `isOutOfFreeMeetings`
  // itself; do not wait on status. Meetings summarised before the quota ran out
  // keep their notes, and whether this is one of them is only known once the
  // query settles — until then the loading state holds the pane, so the card
  // never flashes over a summary that is about to arrive.
  const { isOutOfFreeMeetings, showUpgrade } = useFreeMeetingsPaywall();
  const isSummaryPaywalled = isOutOfFreeMeetings && !loading && !hasNotes;

  // "Polishing": the instant summary finished streaming but the general summary
  // hasn't settled yet. When the general summary arrives, run a one-off reveal
  // where the pill slides down and the general summary wipes into place.
  const isPolishing =
    showInstantSummary && instantSummary.isCompleted && !showUnavailable;
  const revealProgress = useSharedValue(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const wasPolishingRef = useRef(false);
  // Keep the last instant content so it can stay dimmed beneath the reveal after
  // `showInstantSummary` flips false (a general summary now exists).
  const lastInstantContentRef = useRef("");
  if (showInstantSummary && instantSummaryContent) {
    lastInstantContentRef.current = instantSummaryContent;
  }

  useEffect(() => {
    if (isPolishing) wasPolishingRef.current = true;
  }, [isPolishing]);

  // Kick off the reveal once the general summary lands after a polishing phase.
  useEffect(() => {
    if (!showGeneralSummary || !wasPolishingRef.current || isRevealing) return;
    wasPolishingRef.current = false;
    revealProgress.value = 0;
    setIsRevealing(true);
  }, [showGeneralSummary, isRevealing, revealProgress]);

  useEffect(() => {
    if (!isRevealing) return;
    revealProgress.value = withTiming(1, { duration: REVEAL_MS }, (done) => {
      if (done) runOnJS(setIsRevealing)(false);
    });
  }, [isRevealing, revealProgress]);

  // Synced scroll keeps Notes/Tasks panes aligned when switching tabs.
  const { scrollRef, onScroll } = useSyncedPaneScroll(
    mainTab === "notes" && activeNotesView === "ai",
  );
  const didAutoScrollRef = useRef(false);
  const isVideoMeeting = hasPlayableMedia(meeting) && !isAudioOnly(meeting);
  const isSummaryReady = !loading || showInstantSummary;

  useEffect(() => {
    didAutoScrollRef.current = false;
  }, [meeting.id]);

  const scrollToVideoPeek = useCallback(() => {
    if (didAutoScrollRef.current || !isVideoMeeting) return;
    didAutoScrollRef.current = true;
    scrollRef.current?.scrollTo({
      y: NOTEPAD_VIDEO_PEEK_OFFSET,
      animated: true,
    });
  }, [isVideoMeeting, scrollRef]);

  // Wait for the summary query to finish, then scroll after layout settles.
  useEffect(() => {
    if (!isVideoMeeting || !isSummaryReady) return;

    const scroll = () => {
      if (!didAutoScrollRef.current) scrollToVideoPeek();
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(scroll);
    });
    const timeout = setTimeout(scroll, 150);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [isVideoMeeting, isSummaryReady, sections.length, scrollToVideoPeek]);

  const handleContentSizeChange = (_width: number, height: number) => {
    if (!isVideoMeeting || !isSummaryReady || didAutoScrollRef.current) return;
    if (height < NOTEPAD_VIDEO_PEEK_OFFSET) return;
    scrollToVideoPeek();
  };

  // Kept above both terminal states too: the instant summary is all the user
  // has once the general summary is off the table.
  const instantSummaryPreview = showInstantSummary && (
    <NotepadInstantSummary
      meeting={meeting}
      content={instantSummaryContent}
      isCompleted={instantSummary.isCompleted}
    />
  );

  const generalSections = (
    <View style={styles.sections}>
      {!hasNotes && (
        <Text variant="body2Regular" color="textMuted">
          Summary is not available yet.
        </Text>
      )}
      {sections.map((section) => (
        <SummarySection
          key={section.key}
          section={section}
          meetingId={meeting.id}
          canEdit={canEdit}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        nativeID="notepad-pane-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <NotepadMeetingHeader />
        <View ref={notesRef} style={styles.notes}>
          {/* Keep the selector mounted through regeneration: it owns the
              processing slot, so unmounting it would release the slot and drop
              the skeleton state mid-run. */}
          {hasNotes && (
            <View style={styles.templateRow}>
              <NotepadTemplateSelector />
              <View style={{ opacity: isNotesHovered ? 1 : 0 }}>
                <HoverTooltip label="Copy Summary">
                  <Pressable
                    onPress={onCopyAll}
                    style={styles.copyButton}
                    aria-label="Copy Summary"
                  >
                    <IconCopy
                      width={16}
                      height={16}
                      color={theme.colors.commandNeutralDefault}
                    />
                  </Pressable>
                </HoverTooltip>
              </View>
            </View>
          )}
          {isSummaryPaywalled ? (
            <>
              {instantSummaryPreview}
              <FreeMeetingsPaywallPane
                surface="summary"
                showUpgrade={showUpgrade}
              />
            </>
          ) : unavailableReason ? (
            <>
              {instantSummaryPreview}
              <SummaryStatusMessage reason={unavailableReason} />
            </>
          ) : showProcessingState ? (
            <SummaryProcessing />
          ) : isRevealing ? (
            <SummaryReveal
              meeting={meeting}
              instantContent={lastInstantContentRef.current}
              revealing
              progress={revealProgress}
            >
              {generalSections}
            </SummaryReveal>
          ) : isPolishing ? (
            <SummaryReveal
              meeting={meeting}
              instantContent={
                instantSummaryContent ?? lastInstantContentRef.current
              }
              revealing={false}
              progress={revealProgress}
            />
          ) : showInstantSummary ? (
            instantSummaryPreview
          ) : (
            generalSections
          )}
        </View>
      </ScrollView>
      {/* While polishing (before the general summary arrives) the pill floats at
          the pane bottom. During the reveal it rides the edge inside
          SummaryReveal instead. */}
      {isPolishing && (
        <View style={styles.bottomPill} pointerEvents="none">
          <PolishingPill />
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    width: "100%",
  },
  // Floating "Polishing your notes" pill pinned to the pane bottom while the
  // general summary is still generating.
  bottomPill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    gap: NOTEPAD_HEADER_CONTENT_GAP,
    paddingTop: NOTEPAD_CONTENT_TOP_PADDING,
    paddingBottom: 96,
  },
  notes: {
    gap: SUMMARY_TO_NOTES_GAP,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sections: {
    gap: 10,
  },
});
