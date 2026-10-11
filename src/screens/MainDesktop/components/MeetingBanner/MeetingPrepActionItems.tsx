import { type FC } from "react";
import { View } from "react-native";
import { IconArrowRight } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { pluralize } from "@/utils/pluralize";
import type { MeetingPrepAvatarProfile } from "../../hooks/useMeetingPrepSummary";

interface MeetingPrepActionItemsProps {
  participants: MeetingPrepAvatarProfile[];
  taskCount: number;
  maxAvatars?: number;
  // Appends a trailing arrow to signal the row opens the full meeting prep.
  showArrow?: boolean;
}

/**
 * Overlapping avatar group followed by "There were N action items".
 * Shared by the upcoming meeting banner, the sidebar prep hover card, and the
 * realtime panel notes banner.
 */
export const MeetingPrepActionItems: FC<MeetingPrepActionItemsProps> = ({
  participants,
  taskCount,
  maxAvatars = 2,
  showArrow = false,
}) => {
  if (taskCount === 0) return null;

  const visibleAvatars = participants.slice(0, maxAvatars);
  const extraAvatars = Math.max(0, participants.length - maxAvatars);

  return (
    <View style={styles.container}>
      {visibleAvatars.length > 0 && (
        <View style={styles.avatarGroup}>
          {visibleAvatars.map((profile, index) => (
            <View
              key={profile.email ?? index}
              style={[styles.avatarWrap, index > 0 && styles.avatarOverlap]}
            >
              <Avatar
                size={24}
                name={profile.name || profile.email || "?"}
                picture={profile.picture ?? undefined}
                shape="square"
              />
            </View>
          ))}
          {extraAvatars > 0 && (
            <View style={[styles.extraAvatar, styles.avatarOverlap]}>
              <Text variant="body3Weight" style={styles.extraAvatarText}>
                +{extraAvatars}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.label}>
        <Text variant="body2Regular" style={styles.actionItemsText}>
          There {taskCount === 1 ? "was" : "were"} {taskCount}{" "}
          {pluralize("action item", taskCount)}
        </Text>
        {showArrow && (
          <IconArrowRight
            width={16}
            height={16}
            color={DESKTOP_THEME.grey550}
          />
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: DESKTOP_THEME.grey950,
    borderRadius: 4,
  },
  avatarOverlap: {
    marginLeft: -4,
  },
  extraAvatar: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DESKTOP_THEME.grey950,
    backgroundColor: DESKTOP_THEME.grey800,
    alignItems: "center",
    justifyContent: "center",
  },
  extraAvatarText: {
    color: DESKTOP_THEME.grey300,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionItemsText: {
    color: DESKTOP_THEME.grey550,
    letterSpacing: -0.16,
  },
});
