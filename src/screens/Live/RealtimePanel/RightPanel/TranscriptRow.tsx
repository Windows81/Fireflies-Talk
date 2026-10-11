import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import type { GroupedCaption } from "@/components/Transcript";
import { useTranscriptSearch } from "@/screens/Live/Context/TranscriptSearchContext";
import { createStyles, useTheme } from "@/styles";
import { toHHMMSS } from "@/utils/time";
import { type FC } from "react";
import { Platform, View, type TextStyle } from "react-native";
import { HighlightedText } from "../components/HighlightedText";

const UNASSIGNED_SPEAKER_KEY = "unassigned";
const UNASSIGNED_SPEAKER_LABEL = "Unassigned";

// Let users select transcript text and copy with Ctrl+C.
const SELECTABLE_TEXT =
  Platform.OS === "web"
    ? ({ userSelect: "text", cursor: "text" } as unknown as TextStyle)
    : undefined;

export const TranscriptRow: FC<{ caption: GroupedCaption }> = ({ caption }) => {
  const theme = useTheme();
  const { searchText, isSearchActive } = useTranscriptSearch();
  const isUnassignedSpeaker =
    caption.speakerId.toLowerCase() === UNASSIGNED_SPEAKER_KEY ||
    caption.speakerName.toLowerCase() === UNASSIGNED_SPEAKER_KEY;
  const speakerLabel = isUnassignedSpeaker
    ? UNASSIGNED_SPEAKER_LABEL
    : caption.speakerName;

  return (
    <View style={styles.row} role="listitem">
      <View style={styles.header}>
        <View style={styles.speaker}>
          <Avatar name={speakerLabel} size={20} shape="square" />
          <Text variant="body2Weight" color="textSecondary" numberOfLines={1}>
            {speakerLabel}
          </Text>
        </View>
        <View style={styles.timestampGroup}>
          <View style={styles.dot(theme)} />
          <Text
            variant="body2Regular"
            color="informationInteractiveBlueDefault"
          >
            {toHHMMSS(caption.startTime)}
          </Text>
        </View>
      </View>
      <HighlightedText
        text={caption.text}
        query={isSearchActive ? searchText : ""}
        variant="body1LongRegular"
        color="textMuted"
        style={[styles.caption, SELECTABLE_TEXT]}
      />
    </View>
  );
};

const styles = createStyles({
  row: {
    gap: 8,
    paddingVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  speaker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  timestampGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: (theme) => ({
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.textHint,
  }),
  caption: {
    paddingLeft: 36,
  },
});
