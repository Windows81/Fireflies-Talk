import { type Meeting } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/Typography";
import { LiveScreenTranscript } from "../Transcript/LiveScreenTranscript";
import Animated, { FadeIn } from "react-native-reanimated";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { AiNotesSection } from "../Notes/AiNotesSection";
import { EmptyAiNoteSection } from "../Notes/EmptyAiNotesSection";
import { ManualNotesPanel } from "../Notes/ManualNotesPanel";
import { MeetingPrep } from "./MeetingPrep";
import { MEETING_SOURCE } from "@/features/meeting";
import { SystemAudioBanner } from "./SystemAudioBanner";
import {
  useIsManualNotesEnabled,
  useNotesTabTooltipEnabled,
} from "@/features/manual-notes";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { NotesSubToggleDock } from "./NotesSubToggleDock";
import { Tooltip } from "@/features/tooltip/components/Tooltip";
import { useTooltip } from "@/features/tooltip/store";
import { GLOBAL } from "@/styles/color";

const NOTES_TAB_TOOLTIP_KEY = "notes-tab-discovery";

export type CompactPaneTab =
  | "manual-notes"
  | "transcript"
  | "ai-notes"
  | "prep";

const isNotesSubTab = (tab: CompactPaneTab) =>
  tab === "manual-notes" || tab === "ai-notes";

// Below this panel height the transcript empty state (icon/title/description) is
// hidden so it doesn't look cramped; the system-audio banner still shows.
const TRANSCRIPT_EMPTY_STATE_MIN_HEIGHT = 320;

export const CompactNotesTranscript: FC<{
  meeting: Meeting;
  activeContent: CompactPaneTab;
  setActiveContent: (content: CompactPaneTab) => void;
  panelHeight: number;
}> = ({ meeting, activeContent, setActiveContent, panelHeight }) => {
  const theme = useTheme();
  const { formattedChapters } = useLiveScreenContext();
  const notesScrollRef = useRef<ScrollView>(null);
  const isManualNotesEnabled = useIsManualNotesEnabled();
  const isTooltipEnabled = useNotesTabTooltipEnabled();
  const { markTooltipAsShown } = useTooltip();
  const rootRef = useRef<View>(null);
  const [tooltipLeftInset, setTooltipLeftInset] = useState(12);
  const [transcriptAreaHeight, setTranscriptAreaHeight] = useState<
    number | undefined
  >(undefined);

  const measurePanelPosition = useCallback(() => {
    rootRef.current?.measureInWindow((x) => {
      if (x > 0) setTooltipLeftInset(x);
    });
  }, []);

  // When manual notes is enabled, "Notes" is a single top-level tab that
  // contains both manual and AI notes — toggled via the bottom dock. When
  // disabled, AI Notes stays as its own top-level tab.
  const tabs: { key: CompactPaneTab; label: string }[] = isManualNotesEnabled
    ? [
        { key: "manual-notes", label: "Notes" },
        { key: "transcript", label: "Transcript" },
        { key: "prep", label: "Prep" },
      ]
    : [
        { key: "transcript", label: "Transcript" },
        { key: "ai-notes", label: "AI Notes" },
        { key: "prep", label: "Prep" },
      ];

  // Bounce out of the manual-notes sub-tab if the feature gating disappears
  // (e.g. stale persisted state from a previous session).
  useEffect(() => {
    if (!isManualNotesEnabled && activeContent === "manual-notes") {
      setActiveContent("transcript");
    }
  }, [isManualNotesEnabled, activeContent, setActiveContent]);

  const isTabActive = (key: CompactPaneTab) =>
    key === "manual-notes"
      ? isNotesSubTab(activeContent)
      : activeContent === key;

  const handleSelectTab = (tab: CompactPaneTab) => {
    setActiveContent(tab);
    if (tab === "manual-notes") {
      markTooltipAsShown(NOTES_TAB_TOOLTIP_KEY);
    }
    if (tab === "prep") {
      tracker.track(TRACKING_EVENTS.MEETING_PREP_OPENED, {
        meetingId: meeting.id,
        source: "notes_panel_tab",
      });
    }
  };

  const onNotesTab = isNotesSubTab(activeContent);
  const showNotesDock = isManualNotesEnabled && onNotesTab;

  const dock = showNotesDock ? (
    <NotesSubToggleDock
      mode={activeContent === "ai-notes" ? "ai" : "manual"}
      onSelect={(next) =>
        setActiveContent(next === "ai" ? "ai-notes" : "manual-notes")
      }
    />
  ) : null;

  return (
    <View ref={rootRef} style={styles.root} onLayout={measurePanelPosition}>
      <View style={styles.toggleContainer}>
        {tabs.map((tab) => {
          const active = isTabActive(tab.key);
          const button = (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              style={[
                styles.toggleButton,
                active && styles.toggleButtonActive(theme),
              ]}
              onPress={() => handleSelectTab(tab.key)}
            >
              <Text
                variant="title3Regular"
                color={active ? "textPrimary" : "textMuted"}
              >
                {tab.label}
              </Text>
            </Pressable>
          );

          if (tab.key === "manual-notes") {
            return (
              <Tooltip
                key={tab.key}
                tooltipKey={NOTES_TAB_TOOLTIP_KEY}
                title="Take your own notes"
                description="Type alongside the transcript. Saved with the meeting."
                placement="bottom"
                backgroundColor={GLOBAL.purple1100}
                delay={800}
                maxWidth={330}
                disabled={!isTooltipEnabled}
                displayInsets={{
                  top: 8,
                  left: tooltipLeftInset,
                  right: 12,
                  bottom: 8,
                }}
              >
                {button}
              </Tooltip>
            );
          }

          return <View key={tab.key}>{button}</View>;
        })}
      </View>

      <View style={styles.contentArea}>
        {onNotesTab && (
          <Animated.View
            key="notes-content"
            entering={FadeIn.duration(200)}
            style={styles.content}
          >
            {activeContent === "manual-notes" && isManualNotesEnabled && (
              <ManualNotesPanel footerEndSlot={dock} />
            )}
            {activeContent === "ai-notes" && (
              <View style={styles.aiNotesWrapper}>
                <View style={styles.aiNotesBody}>
                  {formattedChapters?.length ? (
                    <ScrollView
                      ref={notesScrollRef}
                      style={styles.scrollView}
                      contentContainerStyle={styles.scrollViewContent}
                      showsVerticalScrollIndicator={true}
                      onContentSizeChange={() => {
                        notesScrollRef.current?.scrollToEnd({ animated: true });
                      }}
                    >
                      <AiNotesSection />
                    </ScrollView>
                  ) : (
                    <EmptyAiNoteSection />
                  )}
                </View>
                {dock && <View style={styles.aiNotesFooter}>{dock}</View>}
              </View>
            )}
          </Animated.View>
        )}

        {/* Transcript - always mounted to preserve FlashList state across tab switches */}
        <View
          key="transcript-content"
          style={
            activeContent === "transcript"
              ? styles.content
              : styles.offscreenContent
          }
          onLayout={(e) =>
            setTranscriptAreaHeight(e.nativeEvent.layout.height - 10)
          }
        >
          {meeting ? (
            <>
              <LiveScreenTranscript
                listHeight={transcriptAreaHeight}
                hideEmptyState={panelHeight < TRANSCRIPT_EMPTY_STATE_MIN_HEIGHT}
              />
              {meeting?.addedBy === MEETING_SOURCE.DESKTOP_RECORD && (
                <SystemAudioBanner />
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body2Regular" color="textSecondary">
                Loading transcript...
              </Text>
            </View>
          )}
        </View>

        {activeContent === "prep" && (
          <Animated.View
            key="prep-content"
            entering={FadeIn.duration(200)}
            style={styles.content}
          >
            <MeetingPrep meetingId={meeting.id} />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    marginBottom: 16,
    overflow: "hidden",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    cursor: "pointer",
  },
  toggleButtonActive: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 4,
  }),
  contentArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  aiNotesWrapper: {
    flex: 1,
    gap: 16,
  },
  aiNotesBody: {
    flex: 1,
  },
  aiNotesFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  offscreenContent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
    pointerEvents: "none",
    userSelect: "none",
    ...(Platform.OS === "web" && {
      visibility: "hidden",
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
});
