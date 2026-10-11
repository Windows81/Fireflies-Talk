import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { getAssigneePillColors } from "@/utils/color";
import { isEmail } from "@/utils/email";
import type { FC, ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { getDisplayName, type NotepadParticipant } from "../../helpers/tasks";

const AssigneePill: FC<{ label: string }> = ({ label }) => {
  const { background, text } = getAssigneePillColors(label);
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text
        variant="body2Regular"
        numberOfLines={1}
        style={[styles.pillText, { color: text }]}
      >
        {label}
      </Text>
    </View>
  );
};

const Row: FC<{ onPress: () => void; children: ReactNode }> = ({
  onPress,
  children,
}) => {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      {({ hovered }: { pressed: boolean; hovered?: boolean }) => (
        <View
          style={[
            styles.row,
            hovered && {
              backgroundColor: theme.colors.interactiveNeutral1Default,
            },
          ]}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
};

export const NotepadAssigneeList: FC<{
  participants: NotepadParticipant[];
  query: string;
  showUnassign: boolean;
  onSelect: (owner: NotepadParticipant | null) => void;
}> = ({ participants, query, showUnassign, onSelect }) => {
  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();
  const filtered = participants.filter(
    (participant) =>
      !normalized ||
      participant.name?.toLowerCase().includes(normalized) ||
      participant.email.toLowerCase().includes(normalized),
  );

  // Custom owners are assigned by email (server contract: ownerType=Email requires
  // a valid address). Offer "Add" only for a valid email not already a participant.
  const showCustom =
    isEmail(trimmed) &&
    !participants.some((p) => p.email.toLowerCase() === normalized);

  return (
    <ScrollView
      style={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {showUnassign && (
        <Row onPress={() => onSelect(null)}>
          <Text variant="body2Regular" color="textSecondary">
            Unassign
          </Text>
        </Row>
      )}
      {filtered.map((participant) => (
        <Row key={participant.email} onPress={() => onSelect(participant)}>
          <AssigneePill
            label={
              getDisplayName(participant.name, participant.email) ??
              participant.email
            }
          />
        </Row>
      ))}
      {showCustom && (
        <Row
          onPress={() =>
            onSelect({ name: null, email: trimmed, picture: null })
          }
        >
          <Text variant="body2Regular" color="textSecondary">
            Add
          </Text>
          <AssigneePill label={getDisplayName(null, trimmed) ?? trimmed} />
        </Row>
      )}
      {filtered.length === 0 && !showCustom && !showUnassign && (
        <View style={styles.empty}>
          <Text variant="body2Regular" color="textDisabled">
            {trimmed ? "No matches" : "No participants"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = createStyles({
  scroll: {
    maxHeight: 280,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pill: {
    maxWidth: 132,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    lineHeight: 20,
  },
  empty: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
