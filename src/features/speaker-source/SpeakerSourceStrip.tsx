import { Text } from "@/components/Typography";
import { useLocalSettings } from "@/features/settings";
import { createStyles, useTheme } from "@/styles";
import type { SpeakerParticipant } from "electron/src/types";
import { type FC } from "react";
import { View } from "react-native";
import { useSpeakerSourceState } from "./useSpeakerSourceState";

/** Lists the people in the open call and highlights who is talking. */
export const SpeakerSourceStrip: FC = () => {
  const enabled = useLocalSettings((s) => s.meetSpeakerNamesBeta);
  const state = useSpeakerSourceState(enabled);

  if (state?.status !== "in-meeting" || state.participants.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Text variant="body2Regular" color="textHint">
        Google Meet (Beta)
      </Text>
      {state.participants.map((participant) => (
        <ParticipantChip key={participant.name} participant={participant} />
      ))}
    </View>
  );
};

const ParticipantChip: FC<{ participant: SpeakerParticipant }> = ({
  participant: { name, speaking },
}) => {
  const theme = useTheme();

  return (
    <View
      style={[styles.chip(theme), speaking && styles.chipSpeaking(theme)]}
      accessibilityLabel={speaking ? `${name}, speaking` : name}
    >
      <View
        style={[styles.dot(theme), speaking && styles.dotSpeaking(theme)]}
      />
      <Text
        variant="body2Regular"
        color={speaking ? "textBrand" : "textHint"}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  chip: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  chipSpeaking: (theme) => ({
    borderColor: theme.colors.borderStaticBrand,
  }),
  dot: (theme) => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.borderStaticDefault,
  }),
  dotSpeaking: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
  }),
});
