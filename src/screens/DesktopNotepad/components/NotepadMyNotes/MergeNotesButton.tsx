import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { useMergeManualNotes } from "../../hooks/useMergeManualNotes";
import { useRowHover } from "../../hooks/useRowHover";

interface Props {
  meetingId: string;
  /** A summary must exist before notes can be merged into it. */
  canMerge: boolean;
}

type PillState = { pressed: boolean; hovered?: boolean };

// Owner-only action that folds the manual notes into the AI summary. Disabled
// (with a hint tooltip) until a summary exists to merge into.
export const MergeNotesButton: FC<Props> = ({ meetingId, canMerge }) => {
  const theme = useTheme();
  const { ref, isHovered } = useRowHover();
  const { merge, isMerging } = useMergeManualNotes(meetingId);

  const disabled = !canMerge || isMerging;
  const label = isMerging ? "Merging…" : "Merge with Notes";

  return (
    <View ref={ref} style={styles.wrapper}>
      <Pressable onPress={merge} disabled={disabled}>
        {({ hovered }: PillState) => {
          const highlighted = !disabled && hovered;
          return (
            <View
              style={[
                styles.pill(theme),
                highlighted && styles.pillActive(theme),
                disabled && styles.pillDisabled,
              ]}
            >
              <Text
                variant="body2Regular"
                color={disabled ? "textHint" : "textBrand"}
              >
                {label}
              </Text>
            </View>
          );
        }}
      </Pressable>
      {!canMerge && !isMerging && isHovered && (
        <View style={styles.tooltip(theme)}>
          <Text variant="body3Regular" color="commandContrastDefault">
            Generate a summary first to merge your notes into it.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    position: "relative",
  },
  pill: (theme) => ({
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  }),
  pillActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
    borderColor: theme.colors.borderInteractiveHover,
  }),
  pillDisabled: {
    opacity: 0.6,
  },
  tooltip: (theme) => ({
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 8,
    width: 240,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.layerStrong,
    zIndex: 10,
  }),
});
