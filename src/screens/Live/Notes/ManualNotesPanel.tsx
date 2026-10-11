import { Checkbox } from "@/components/Checkbox";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import {
  uploadManualNotesForMeeting,
  useManualNotes,
} from "@/features/manual-notes";
import { useLiveScreenContext } from "@/screens/Live/Context/LiveScreenContext";
import { createStyles } from "@/styles";
import { type FC, type ReactNode, useCallback } from "react";
import { View } from "react-native";
import { ManualNotesEditor } from "./ManualNotesEditor";

const MERGE_TOOLTIP_LABEL =
  "Your notes will be merged to the meeting summary after the call.";

type ManualNotesLayout = "panel" | "inline";

interface ManualNotesPanelProps {
  /** "panel" (default) shows the textarea full-bleed with the merge checkbox
   * in a footer. "inline" shows a header row with the section title and the
   * merge checkbox aligned to its right. */
  layout?: ManualNotesLayout;
  /** Title rendered in the inline header. Ignored for "panel". */
  title?: string;
  placeholder?: string;
  /** Minimum height for the textarea (defaults to 120). */
  minInputHeight?: number;
  /** Optional content rendered alongside the merge checkbox in the panel
   * footer (e.g. the compact-pane sub-tab dock). When the user is not the
   * meeting owner the merge checkbox is hidden, but this slot still renders
   * so the parent's footer chrome stays in place. */
  footerEndSlot?: ReactNode;
}

export const ManualNotesPanel: FC<ManualNotesPanelProps> = ({
  layout = "panel",
  title = "My Notes",
  placeholder = "Type your notes here…",
  minInputHeight = 120,
  footerEndSlot,
}) => {
  const { meeting, meetingId } = useLiveScreenContext();
  const { user } = useAuth();
  const { notes, setNotes, shouldMerge, setShouldMerge } =
    useManualNotes(meetingId);

  const isOwner = Boolean(
    user?.email && meeting?.organizerEmail === user.email,
  );

  const handleShouldMergeChange = useCallback(
    (next: boolean) => {
      setShouldMerge(next);
      if (notes.trim()) {
        void uploadManualNotesForMeeting(meetingId, { clearOnSuccess: false });
      }
    },
    [setShouldMerge, notes, meetingId],
  );

  const mergeCheckbox = isOwner ? (
    <HoverTooltip
      label={MERGE_TOOLTIP_LABEL}
      position={layout === "panel" ? "top" : "bottom"}
      align="start"
    >
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={shouldMerge}
          onValueChange={handleShouldMergeChange}
          size={16}
          style={styles.checkbox}
          nativeID="no-drag"
        />
        <Text variant="body2Regular" color="commandContrastDisabled">
          Merge to summary
        </Text>
      </View>
    </HoverTooltip>
  ) : null;

  const showInlineHeader = layout === "inline" && (title || mergeCheckbox);

  return (
    <View style={styles.root}>
      {showInlineHeader && (
        <View style={styles.headerRow} nativeID="no-drag">
          <Text variant="title3Weight" color="textPrimary">
            {title}
          </Text>
          {mergeCheckbox}
        </View>
      )}
      <ManualNotesEditor
        notes={notes}
        setNotes={setNotes}
        placeholder={placeholder}
        minHeight={minInputHeight}
      />
      {layout === "panel" && (mergeCheckbox || footerEndSlot) && (
        <View style={styles.footer} nativeID="no-drag">
          <View style={styles.footerSide}>{mergeCheckbox}</View>
          {footerEndSlot ? (
            <>
              <View style={styles.footerCenter}>{footerEndSlot}</View>
              <View style={styles.footerSide} />
            </>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  footerCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    minHeight: 28,
    paddingVertical: 0,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
