import { useMemo, useCallback, type FC } from "react";
import { Pressable, View } from "react-native";
import { Button, LinkButton } from "@/components/Button";
import { ConfirmationDialog } from "@/components/Dialog";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { toast } from "@/components/Toast";
import { createStyles, useTheme, vars } from "@/styles";
import {
  IconChrome,
  IconGoogleMeetLogo,
  IconMoreHorizontal,
  IconMsTeamsLogo,
  IconRecord,
  IconStopCircle,
  IconZoomLogo,
  IconSlack,
  IconWhatsapp,
  IconAircall,
  IconFacetime,
  IconDiscord,
  IconChatgptAtlas,
  IconComet,
} from "@/assets/svg";
import { RouteNames } from "@/constants";
import type { LocalMeetingRecord } from "@/features/desktop-meeting-detection";
import {
  BROWSER_PATTERNS,
  findCalendarTitleForDetectedMeeting,
  getPlatformIconKey,
  getPlatformName,
  isPuppetSupportedPlatform,
  meetingDetectionApi,
  useMeetingDetectionStore,
} from "@/features/desktop-meeting-detection";
import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { useRecordActionsContext } from "@/features/live-record";
import { useRecorder } from "@/features/live-record";
import { isDesktop } from "@/utils/device";
import { useBooleanState } from "@/utils/states";
import {
  liveMeetingsApi,
  pendingAddToLiveApi,
  openLiveDestination,
} from "@/features/live";
import { useCreateMeetingInMediaStorageWithUrlMutation } from "@/graphql";
import { format } from "date-fns";
import { WebConfButton } from "../../Home/UpcomingMeetings/components/WebConfButton";

const iconMap = {
  gmeet: IconGoogleMeetLogo,
  zoom: IconZoomLogo,
  teams: IconMsTeamsLogo,
  chrome: IconChrome,
  slack: IconSlack,
  whatsapp: IconWhatsapp,
  aircall: IconAircall,
  facetime: IconFacetime,
  discord: IconDiscord,
  chatgpt: IconChatgptAtlas,
  comet: IconComet,
} as const;

const getTitlePlatformName = (record: LocalMeetingRecord): string => {
  const displayName = record.event.displayName?.trim() || record.event.platform;
  if (!displayName) return "";

  const normalized = displayName.toLowerCase();
  if (normalized === "ms teams" || normalized === "microsoft teams") {
    return "Teams";
  }

  return displayName;
};

const getRecordingTitle = (record: LocalMeetingRecord): string => {
  const { event } = record;
  const displayName = event.displayName?.trim();
  const platform = event.platform?.toLowerCase() || "";
  const isBrowserPlatform = BROWSER_PATTERNS.some((pattern) =>
    platform.includes(pattern),
  );

  if (platform.includes("system-audio") || platform.includes("system audio")) {
    return "Quick Notes";
  }

  if (platform.includes("slack")) {
    return "Recording Slack huddle";
  }

  if (isBrowserPlatform) {
    const browserName =
      displayName || (event.platform && getPlatformName(event.platform));
    return `Recording audio in ${browserName || "browser"}`;
  }

  const platformTitle = getTitlePlatformName(record);
  if (isPuppetSupportedPlatform(event.platform)) {
    return `Recording ${platformTitle} meeting`;
  }

  if (displayName) {
    return `Recording ${displayName}`;
  }

  if (platformTitle) {
    return `Recording ${platformTitle}`;
  }

  return "Recording meeting";
};

const getMeetingTitle = (record: LocalMeetingRecord): string => {
  const { event } = record;
  const displayName = event.displayName?.trim();
  const platform = event.platform?.toLowerCase() || "";
  const isBrowserPlatform = BROWSER_PATTERNS.some((pattern) =>
    platform.includes(pattern),
  );

  if (platform.includes("system-audio") || platform.includes("system audio")) {
    return "Quick Notes";
  }

  if (platform.includes("slack")) {
    return "Slack huddle";
  }

  if (event.type === "audio" && isBrowserPlatform && !event.originalUrl) {
    return `Meeting started in ${displayName || "browser"}`;
  }

  if (event.originalUrl) {
    try {
      const parsed = new URL(
        event.originalUrl.startsWith("http")
          ? event.originalUrl
          : `https://${event.originalUrl}`,
      );
      const hostname = parsed.hostname.toLowerCase();
      const pathSegment = parsed.pathname.split("/").filter(Boolean)[0];
      if (
        hostname === "meet.google.com" ||
        hostname.endsWith(".meet.google.com")
      ) {
        return pathSegment ? `Meet - ${pathSegment}` : "Google Meet";
      }
    } catch {
      // Fall back to display name
    }
  }

  if (displayName) {
    return `${displayName} meeting`;
  }

  return "Meeting detected";
};

const getMeetingSubtitle = (record: LocalMeetingRecord): string => {
  const { event } = record;
  const platform = event.platform?.toLowerCase() || "";
  if (platform.includes("system-audio") || platform.includes("system audio")) {
    return "";
  }
  if (event.browserName) {
    return getPlatformName(event.browserName);
  }
  return event.platform ? getPlatformName(event.platform) : "";
};

const CAPTURE_TOOLTIP =
  "Captures via system audio. No Audio/Video recording & Speaker labels.";
const INVITE_TOOLTIP =
  "Invite Fireflies bot. Joins your meeting. Visible to all participants.";

type LocalMeetingItemProps = {
  record: LocalMeetingRecord;
  onOpenInviteModal?: (url?: string) => void;
};

export const LocalMeetingItem: FC<LocalMeetingItemProps> = ({
  record,
  onOpenInviteModal,
}) => {
  const theme = useTheme();
  const calendarEvents = useMeetingDetectionStore(
    (state) => state.calendarEvents,
  );
  const { startRecording, stopRecording, startInputs } =
    useRecordActionsContext();
  const context = useRecorder((state) => state.context);
  const [createMeeting, { loading: isInviting }] =
    useCreateMeetingInMediaStorageWithUrlMutation();

  const platformIconKey =
    getPlatformIconKey(record.event.platform) ||
    getPlatformIconKey(record.event.displayName);
  const PlatformIcon =
    (platformIconKey && iconMap[platformIconKey]) || IconRecord;

  const normalizedPlatform = record.event.platform?.toLowerCase() || "";
  const isBrowserPlatform = BROWSER_PATTERNS.some((pattern) =>
    normalizedPlatform.includes(pattern),
  );
  const inviteSupported =
    isPuppetSupportedPlatform(record.event.platform) || isBrowserPlatform;

  const isRecording = record.status === "recording";
  const isEnded = record.status === "ended";
  const isEndedProcessing = isEnded && record.endedReason === "recording";

  // Computed during render: the match depends on Date.now(), so memoizing it
  // would go stale while an event's live window passes.
  const matchingCalendarTitle = findCalendarTitleForDetectedMeeting(
    calendarEvents,
    {
      url: record.event.originalUrl,
      platform: record.event.platform,
      urlFromCalendar: record.event.urlFromCalendar,
    },
  );

  const meetingTitle = useMemo(
    () =>
      isRecording && matchingCalendarTitle
        ? `Recording ${matchingCalendarTitle}`
        : isRecording
          ? getRecordingTitle(record)
          : getMeetingTitle(record),
    [isRecording, matchingCalendarTitle, record],
  );
  const meetingSubtitle = useMemo(() => getMeetingSubtitle(record), [record]);

  const handleCapture = useCallback(() => {
    const resolvedTitle = startInputs.title.trim()
      ? startInputs.title
      : matchingCalendarTitle || startInputs.title;

    startRecording({
      ...startInputs,
      title: resolvedTitle,
      recordingSource: {
        type: "notification",
        processId: record.event.processId,
        processName: record.event.processName,
        parentProcessName: record.event.parentProcessName,
        parentProcessId: record.event.parentProcessId,
        platform: record.event.platform,
        displayName: record.event.displayName,
        meetingUrl: record.event.originalUrl,
      },
    });
  }, [matchingCalendarTitle, record.event, startInputs, startRecording]);

  const handleInvite = useCallback(async () => {
    if (!inviteSupported) return;

    if (!record.event.originalUrl) {
      onOpenInviteModal?.();
      return;
    }

    let fixedUrl = record.event.originalUrl.trim();
    if (!fixedUrl.startsWith("http")) {
      fixedUrl = `https://${fixedUrl}`;
    }

    try {
      const response = await createMeeting({
        variables: {
          url: fixedUrl,
          title: format(new Date(), "MMM dd, hh:mm aa"),
        },
      });

      if (response.data?.createMeetingInMediaStorageWithURL?.meeting) {
        liveMeetingsApi.refetch();
        meetingDetectionApi.setLocalMeetingStatus(record.id, "invited");

        // Surface the "Notetaker will join shortly" banner for at most 2 minutes
        // (or until the meeting goes live).
        const invitedMeetingId = (
          response.data.createMeetingInMediaStorageWithURL.meeting as {
            meeting?: string;
          }
        )?.meeting;
        pendingAddToLiveApi.add({
          id: invitedMeetingId ?? fixedUrl,
          url: fixedUrl,
          meetingId: invitedMeetingId,
        });

        // Show bot invited notification
        window.electron?.notification?.show(
          "Fireflies notetaker invited",
          "The notetaker will join the meeting in few secs.",
          "",
          "",
          { showProgress: false, showCloseAlways: true, timeout: 3000 },
        );
      } else {
        toast({
          title: "Could not add to meeting",
          message: "Something went wrong",
          type: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Could not add to meeting",
        message: (error as Error).message,
        type: "error",
      });
    }
  }, [
    inviteSupported,
    record.id,
    record.event.originalUrl,
    createMeeting,
    onOpenInviteModal,
  ]);

  const meetingId = record.recordingMeetingId || context?.meetingId;
  const handleOpenLiveAssist = useCallback(() => {
    if (!isDesktop || !meetingId) return;
    const liveUrl = `/live/${meetingId}?source=recording`;
    openLiveDestination(liveUrl);
  }, [meetingId]);

  const [
    isOpenStopRecordingDialog,
    openStopRecordingDialog,
    closeStopRecordingDialog,
  ] = useBooleanState();

  const isRealtimePanelEnabled = useFeatureIsOn(FEATURE_FLAGS.REALTIME_MEETING);

  const handleStopRecording = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  if (isRecording) {
    return (
      <>
        <View style={liveMeetingItemStyles.root}>
          <View style={liveMeetingItemStyles.info}>
            <View style={liveMeetingItemStyles.tagline}>
              <View style={liveMeetingItemStyles.tag}>
                <Text style={liveMeetingItemStyles.tagText}>Now</Text>
              </View>
              <Text variant="body2Regular" color="textMuted">
                {format(new Date(record.updatedAt), "hh:mm a")}
              </Text>
            </View>
            <Text variant="body1Weight" color="textSecondary" numberOfLines={2}>
              {context?.title?.trim() ? context.title : meetingTitle}
            </Text>
          </View>
          <View style={liveMeetingItemStyles.footer}>
            <WebConfButton url={record.event.originalUrl} />
            <View style={liveMeetingItemStyles.actions}>
              {isDesktop && (
                <Button
                  onPress={handleOpenLiveAssist}
                  variant="transparentNeutral"
                  size="xs"
                  Icon={IconMoreHorizontal}
                  style={liveMeetingItemStyles.openLiveButton}
                  disabled={!meetingId}
                >
                  Live Assist
                </Button>
              )}
              {isRealtimePanelEnabled && !isDesktop && meetingId && (
                <LinkButton
                  href={{
                    pathname: RouteNames.Live,
                    params: {
                      id: meetingId,
                      source: "recording",
                    },
                  }}
                  variant="transparentNeutral"
                  size="xs"
                  Icon={IconMoreHorizontal}
                  style={liveMeetingItemStyles.openLiveButton}
                >
                  Live Assist
                </LinkButton>
              )}
              <Pressable
                style={({ pressed }) => [
                  liveMeetingItemStyles.stopButton,
                  pressed && liveMeetingItemStyles.stopButtonPressed,
                ]}
                onPress={openStopRecordingDialog}
              >
                <IconStopCircle
                  width={20}
                  height={20}
                  color={vars.colors.red400}
                />
              </Pressable>
            </View>
          </View>
        </View>
        <ConfirmationDialog
          title="End meeting"
          isOpen={isOpenStopRecordingDialog}
          close={closeStopRecordingDialog}
          onConfirm={handleStopRecording}
          variant="bottomSheet"
          confirmText="End meeting"
        >
          Are you sure you want to stop recording this meeting?
        </ConfirmationDialog>
      </>
    );
  }

  return (
    <View
      style={[
        styles.card(theme),
        record.status === "ended" && styles.cardEnded(theme),
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.textBlock}>
            <View style={styles.titleRow}>
              <PlatformIcon
                width={18}
                height={18}
                color={theme.colors.textPrimary}
              />
              <Text variant="body2Weight" color="textPrimary" numberOfLines={1}>
                {meetingTitle}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      record.status === "ended"
                        ? theme.colors.interactiveSecondaryHover
                        : theme.colors.interactiveSecondaryDisabled,
                  },
                ]}
              >
                <Text
                  variant="body3Weight"
                  color="commandPrimaryDefault"
                  numberOfLines={1}
                >
                  {record.status === "ended" ? "Ended" : "Live"}
                </Text>
              </View>
            </View>
            {meetingSubtitle ? (
              <Text variant="body3Regular" color="textMuted">
                {meetingSubtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {!isEnded && (
          <View style={styles.actionsRow}>
            {inviteSupported ? (
              <>
                <HoverTooltip label={INVITE_TOOLTIP}>
                  <Button
                    variant="primary"
                    size="xs"
                    onPress={handleInvite}
                    disabled={isInviting}
                  >
                    Invite Notetaker
                  </Button>
                </HoverTooltip>
                <HoverTooltip label={CAPTURE_TOOLTIP}>
                  <Button variant="secondary" size="xs" onPress={handleCapture}>
                    Take Notes
                  </Button>
                </HoverTooltip>
              </>
            ) : (
              <HoverTooltip label={CAPTURE_TOOLTIP}>
                <Button variant="primary" size="xs" onPress={handleCapture}>
                  Take Notes
                </Button>
              </HoverTooltip>
            )}
          </View>
        )}
      </View>

      {isEndedProcessing && (
        <Text variant="body3Regular" color="textMuted">
          Processing the meeting.
        </Text>
      )}
    </View>
  );
};

const styles = createStyles({
  card: (theme) => ({
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    padding: 16,
    gap: 12,
  }),
  cardEnded: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  textBlock: {
    flexDirection: "column",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

const liveMeetingItemStyles = createStyles({
  root: {
    padding: 20,
    borderRadius: 8,
    borderColor: vars.colors.red500,
    borderWidth: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 24,
  },
  info: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  tagline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderRadius: 2,
    backgroundColor: vars.colors.red50,
  },
  tagText: {
    color: vars.colors.red700,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  stopButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: vars.colors.red50,
  },
  stopButtonPressed: {
    backgroundColor: vars.colors.red100,
  },
  openLiveButton: {
    ...vars.elevations[2],
    paddingHorizontal: 16,
    borderColor: vars.colors.grey200,
    borderWidth: 1,
  },
});
