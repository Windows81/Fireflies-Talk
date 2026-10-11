import {
  IconCheckCircle,
  IconDownload,
  IconGlobe,
  IconMessageCircle,
  IconMoreVertical,
  IconPlus,
  IconSearch,
  IconShare,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { CircularProgress } from "@/components/CircularProgress";
import { HeaderIconButton, HeaderSideContainer } from "@/components/Layout";
import { toast } from "@/components/Toast";
import {
  DownloadStatus,
  saveOffline,
  useOwnedDownload,
} from "@/features/downloads";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { MEETING_SOURCE } from "@/features/meeting";
import type { Dispatch, FC, SetStateAction } from "react";
import { Platform, View } from "react-native";
import Animated, { FadeInLeft, FadeOutLeft } from "react-native-reanimated";

// Save-offline state in the header: download icon → circular progress while
// downloading → check when the meeting is saved.
const HeaderDownloadButton: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const entry = useOwnedDownload(meeting.id);

  if (
    entry?.isManual &&
    (entry.status.state === DownloadStatus.PENDING ||
      entry.status.state === DownloadStatus.IN_PROGRESS)
  ) {
    return (
      <View style={styles.downloadProgress}>
        <CircularProgress
          size={22}
          value={
            entry.status.state === DownloadStatus.IN_PROGRESS
              ? entry.status.progress * 100
              : 0
          }
        />
      </View>
    );
  }

  if (entry?.isManual && entry.status.state === DownloadStatus.COMPLETE) {
    return (
      <HeaderIconButton
        Icon={IconCheckCircle}
        label="Saved offline"
        onPress={() =>
          toast({
            message:
              "This meeting is available offline. Manage saved meetings in Profile → Downloads",
          })
        }
      />
    );
  }

  const onPress = async () => {
    const outcome = await saveOffline(meeting);
    toast({
      message: outcome === "queued" ? "Downloading meeting…" : "Saved offline",
    });
  };

  return (
    <HeaderIconButton
      Icon={IconDownload}
      label="Save offline"
      onPress={() => void onPress()}
    />
  );
};

export const HeaderRight: FC<{
  meeting: Meeting;
  setOverlay: Dispatch<
    SetStateAction<"search" | "thread" | "add-soundbite" | null>
  >;
  openShare: () => void;
  openMenu: () => void;
}> = ({ meeting, setOverlay, openShare, openMenu }) => {
  const toggleOverlay = (overlay: "search" | "thread") => {
    setOverlay((prev) => (prev === overlay ? null : overlay));
  };

  return (
    <Animated.View
      exiting={FadeOutLeft.duration(300)}
      entering={FadeInLeft.duration(300)}
    >
      <HeaderSideContainer>
        <HeaderIconButton
          Icon={IconSearch}
          label="Search transcript"
          onPress={() => toggleOverlay("search")}
        />
        <HeaderIconButton
          Icon={IconMessageCircle}
          label="Comments"
          onPress={() => {
            toggleOverlay("thread");
            tracker.track(TRACKING_EVENTS.MEETING_COMMENTS_VIEWED, {
              meetingId: meeting.id,
              from: "screen/header",
            });
          }}
        />
        <HeaderIconButton
          Icon={IconShare}
          label="Share"
          onPress={() => {
            openShare();
            tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
              type: "meeting",
              from: "screen/header",
              id: meeting.id,
              privacy: meeting.notesPrivacy,
            });
          }}
        />
        {/* Offline save is iOS/Android-only; "web" also covers Electron desktop. */}
        {Platform.OS !== "web" && <HeaderDownloadButton meeting={meeting} />}
        <HeaderIconButton
          Icon={IconMoreVertical}
          label="More"
          onPress={openMenu}
        />
      </HeaderSideContainer>
    </Animated.View>
  );
};

export const HeaderRightDesktop: FC<{
  meeting: Meeting;
  openShare: () => void;
  openMenu: () => void;
  openCreateSoundbite: () => void;
}> = ({ meeting, openShare, openMenu, openCreateSoundbite }) => {
  const theme = useTheme();
  return (
    <HeaderSideContainer>
      {!!meeting.captions?.length &&
        meeting.addedBy !== MEETING_SOURCE.DESKTOP_RECORD && (
          <Button
            variant="transparentNeutral"
            Icon={IconPlus}
            aria-label="Create Soundbite"
            onPress={openCreateSoundbite}
            size="xs"
          >
            Soundbite
          </Button>
        )}
      <View style={styles.seperator(theme)} />
      <Button
        Icon={IconGlobe}
        onPress={() => {
          openShare();
          tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
            type: "meeting",
            from: "screen/header",
            id: meeting.id,
            privacy: meeting.notesPrivacy,
          });
        }}
        size="xs"
      >
        Share
      </Button>
      <Button
        variant="transparentNeutral"
        Icon={IconMoreVertical}
        aria-label="More"
        onPress={openMenu}
        size="xs"
      />
    </HeaderSideContainer>
  );
};

const styles = createStyles({
  downloadProgress: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  seperator: (theme) => ({
    width: 1,
    height: 24,
    backgroundColor: theme.colors.borderStaticSubtle,
  }),
});
