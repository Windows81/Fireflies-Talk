import { IconLink2, IconShare } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { HoverTooltip } from "@/components/HoverTooltip";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config, RouteNames } from "@/constants";
import { ShareMeetingDialog } from "@/features/meeting";
import { openURL } from "@/features/navigation";
import type { Source } from "@/graphql";
import { useIsDesktopNotepadEnabled } from "@/screens/DesktopNotepad/hooks/useIsDesktopNotepadEnabled";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { copyAsText } from "@/utils/clipboard";
import { useBooleanState } from "@/utils/states";
import { format } from "date-fns";
import type { FC } from "react";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface DesktopHomeMeetingCardProps {
  meeting: Source;
}

export const DesktopHomeMeetingCard: FC<DesktopHomeMeetingCardProps> = ({
  meeting,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const isInAppNotepadEnabled = useIsDesktopNotepadEnabled();
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenShare, openShare, closeShare] = useBooleanState();

  const meetingId = meeting.parseId as string;
  const meetingUrl = `${Config.DASHBOARD_URL}/view/${meetingId}`;

  const openMeeting = () => {
    if (isInAppNotepadEnabled) {
      navigation.navigate(RouteNames.DesktopNotepad, { id: meetingId });
      return;
    }
    tracker.track(TRACKING_EVENTS.OPEN_IN_DASHBOARD, { linkType: "notepad" });
    openURL(meetingUrl);
  };

  const copyToClipboard = () => {
    copyAsText(meetingUrl)
      .then(() => toast({ message: "Meeting link copied" }))
      .catch(() => toast({ message: "Failed to copy link" }));
  };

  // Drive hover via DOM mouseenter/leave instead of Pressable's onHoverIn/Out:
  // RNW configures every Pressable with `contain: true`, so entering a child
  // Pressable (the Copy/Share buttons) ends the row's hover and the actions
  // flicker. mouseenter/leave are descendant-aware and immune to that.
  const webProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return (
    <>
      <Pressable
        style={[styles.card, isHovered && styles.cardHovered(theme)]}
        onPress={openMeeting}
        {...webProps}
      >
        <Avatar
          size={32}
          name={meeting.creatorProfile?.name || meeting.creator_email}
          picture={meeting.creatorProfile?.picture}
          shape="square"
        />
        <View style={styles.text}>
          <Text variant="title3Weight" color="textSecondary" numberOfLines={1}>
            {meeting.title}
          </Text>
          {meeting.date && (
            <Text variant="body3Regular" color="textHint">
              {format(new Date(meeting.date), "h:mm a")}
            </Text>
          )}
        </View>
        {/* Actions stay mounted and reserve their space so the hover region and
            row layout don't shift when revealed — otherwise the buttons get
            pulled out from under the cursor before a click can land. */}
        <View
          style={[styles.actions, !isHovered && styles.actionsHidden]}
          pointerEvents={isHovered ? "auto" : "none"}
        >
          <HoverTooltip
            label="Copy link to meeting notes"
            position="bottom"
            align="center"
          >
            <Button
              variant="transparentNeutral"
              size="xs"
              onPress={copyToClipboard}
              accessibilityLabel="Copy link to meeting notes"
            >
              <IconLink2
                width={20}
                height={20}
                color={theme.colors.textPrimary}
              />
            </Button>
          </HoverTooltip>
          <HoverTooltip label="Share" position="bottom" align="center">
            <Button
              variant="transparentNeutral"
              size="xs"
              onPress={openShare}
              accessibilityLabel="Share meeting"
            >
              <IconShare
                width={20}
                height={20}
                color={theme.colors.textPrimary}
              />
            </Button>
          </HoverTooltip>
        </View>
      </Pressable>

      <ShareMeetingDialog
        meetingId={meetingId}
        isOpen={isOpenShare}
        close={closeShare}
      />
    </>
  );
};

const styles = createStyles({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    width: "100%",
  },
  cardHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  text: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionsHidden: {
    opacity: 0,
  },
});
