import { IconCopy } from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { toast } from "@/components/Toast";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { copyAsText } from "@/utils/clipboard";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { ASSISTANT_TABS } from "../constants";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { useDesktopNotepadTranscript } from "../hooks/useDesktopNotepadTranscript";
import { hiddenPaneStyle } from "../styles";
import { SegmentTabs } from "../shared/SegmentTabs";
import type { AssistantTab } from "../types";
import { DesktopAskFred } from "./AskFred/DesktopAskFred";
import { NotepadTranscriptPane } from "./NotepadTranscript/NotepadTranscriptPane";

export const DesktopNotepadAssistantPane = () => {
  const theme = useTheme();
  const { meeting, assistantTab, setAssistantTab } = useDesktopNotepadContext();
  const { captions } = useDesktopNotepadTranscript(meeting);

  const onChangeTab = useCallback(
    (next: AssistantTab) => {
      if (next !== assistantTab && next === "transcript") {
        tracker.track(TRACKING_EVENTS.NOTEPAD_TAB_CLICKED, {
          meetingId: meeting.id,
          tab: "transcript",
        });
      }
      setAssistantTab(next);
    },
    [assistantTab, setAssistantTab, meeting.id],
  );

  const onCopyTranscript = useCallback(() => {
    if (!captions.length) return;
    const text = captions.map((c) => `${c.speakerName}: ${c.text}`).join("\n");
    copyAsText(text).then(
      () => toast({ message: "Copied to clipboard" }),
      (error) =>
        toast({
          title: "Failed to copy",
          message: error.message,
          type: "error",
        }),
    );
  }, [captions]);

  return (
    <View style={styles.pane(theme)}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          <SegmentTabs
            tabs={ASSISTANT_TABS}
            value={assistantTab}
            onChange={onChangeTab}
          />
        </View>
        {assistantTab === "transcript" && captions.length > 0 && (
          <HoverTooltip label="Copy Transcript">
            <Pressable
              onPress={onCopyTranscript}
              style={styles.copyButton}
              aria-label="Copy Transcript"
            >
              <IconCopy
                width={14}
                height={14}
                color={theme.colors.commandNeutralDefault}
              />
            </Pressable>
          </HoverTooltip>
        )}
      </View>
      <View style={styles.content}>
        <View style={hiddenPaneStyle(assistantTab === "ask-fred")}>
          <DesktopAskFred />
        </View>
        <View style={hiddenPaneStyle(assistantTab === "transcript")}>
          <NotepadTranscriptPane />
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  content: {
    flex: 1,
    minHeight: 0,
  },
  pane: (theme) => ({
    width: 400,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.layerMuted,
    backgroundColor: theme.colors.layerDefault,
    overflow: "hidden",
  }),
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabs: {
    flex: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});
