import { IconUsers } from "@/assets/svg";
import { BaseModal } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { useLocalSettings } from "@/features/settings";
import {
  CONSENT_CHAT_BANNER_SEEN_FLAG_KEY,
  SPEAKER_LABELS_ANNOUNCEMENT_SEEN_FLAG_KEY,
  getLocalUserFlag,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { realRecordingsCountStore } from "@/features/live-record";
import { DARK_VIBRANT, DESKTOP_THEME } from "@/styles/color";
import {
  getActualPlatform,
  isDesktop,
  isMainDesktopWindow,
} from "@/utils/device";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { type FC, useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { TranscriptMockPanel } from "./components/TranscriptMockPanel";

// Web-only backdrop blur behind the modal, same cast as the other desktop
// modals since StyleSheet.create doesn't type backdropFilter.
const webBlurStyle = StyleSheet.create({
  blur: { backdropFilter: "blur(8px)" } as never,
}).blur;

const selectRealRecordingsCount = (
  state: ReturnType<typeof realRecordingsCountStore.getState>,
) => state.count;

/**
 * One-time announcement that transcripts can now name who is speaking,
 * offering to turn the BETA setting on. Same layout as the chat-consent
 * announcement (KeepEveryoneInTheLoopModal).
 */
export const SpeakerLabelsAnnouncementModal: FC = () => {
  const [seen, setSeen] = useState(
    () => !!getLocalUserFlag(SPEAKER_LABELS_ANNOUNCEMENT_SEEN_FLAG_KEY),
  );
  const realRecordingsCount = realRecordingsCountStore(
    selectRealRecordingsCount,
  );
  const { meetSpeakerNamesBeta, setMeetSpeakerNamesBeta } = useLocalSettings();
  const chatAnnouncementSettled = userLocalUserFlagsStore(
    (state) => !!state.flags[CONSENT_CHAT_BANNER_SEEN_FLAG_KEY],
  );

  const dismiss = useCallback(() => {
    setLocalUserFlag(SPEAKER_LABELS_ANNOUNCEMENT_SEEN_FLAG_KEY, true);
    setSeen(true);
  }, []);

  const handleSkip = useCallback(() => {
    tracker.track(
      TRACKING_EVENTS.DESKTOP_SPEAKER_LABELS_ANNOUNCEMENT_SKIP_CLICKED,
    );
    dismiss();
  }, [dismiss]);

  const handleEnable = useCallback(() => {
    tracker.track(
      TRACKING_EVENTS.DESKTOP_SPEAKER_LABELS_ANNOUNCEMENT_ENABLE_CLICKED,
    );
    // Reading the meeting window needs the Accessibility permission, so
    // trigger the system prompt now instead of failing silently later.
    window.electron?.browserMeetings?.requestAccessibilityPermission();
    setMeetSpeakerNamesBeta(true);
    dismiss();
  }, [setMeetSpeakerNamesBeta, dismiss]);

  // Speaker names are only read on macOS for now. The chat-consent
  // announcement shares this trigger, so wait until it has been answered.
  const shouldRender =
    isDesktop &&
    getActualPlatform() === "darwin" &&
    isMainDesktopWindow() &&
    !seen &&
    chatAnnouncementSettled &&
    realRecordingsCount >= 1 &&
    !meetSpeakerNamesBeta;

  if (!shouldRender) return null;

  return (
    <BaseModal visible transparent onRequestClose={dismiss}>
      <View style={[styles.overlay, webBlurStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          <View style={styles.leftColumn}>
            <View style={styles.textGroup}>
              <View style={styles.iconBox}>
                <IconUsers
                  width={20}
                  height={20}
                  color={DESKTOP_THEME.blue900}
                />
              </View>
              <View style={styles.textStack}>
                <Text
                  variant="heading4Weight"
                  color="textPrimary"
                  fontSize={20}
                  lineHeightMultiplier={1.3}
                >
                  Know Who Said What
                </Text>
                <Text
                  variant="body1Regular"
                  color="textMuted"
                  fontSize={14}
                  lineHeightMultiplier={1.5}
                >
                  Transcripts can now show participant names instead of Speaker
                  1, Speaker 2 when you capture a call. Starting with Google
                  Meet in Chrome on Mac, with more meeting apps coming over
                  time. Early version, you can turn it off anytime in Settings.
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleEnable}
                style={styles.enableButton}
              >
                <Text variant="label2Weight" style={styles.enableLabel}>
                  Turn on
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text variant="label2Weight" style={styles.skipLabel}>
                  Not now
                </Text>
              </Pressable>
            </View>
          </View>

          <TranscriptMockPanel />
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    flexDirection: "row",
    width: 803,
    height: 384,
    flexShrink: 0,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    borderRadius: 16,
    overflow: "hidden",
  },
  leftColumn: {
    width: 402,
    paddingTop: 66,
    paddingLeft: 46,
    paddingRight: 20,
    paddingBottom: 66,
    justifyContent: "space-between",
  },
  textGroup: {
    gap: 32,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: DESKTOP_THEME.grey950,
    alignItems: "center",
    justifyContent: "center",
  },
  textStack: {
    gap: 10,
    maxWidth: 300,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  enableButton: {
    paddingHorizontal: 14,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESKTOP_THEME.purple600,
    borderRadius: 4,
  },
  enableLabel: {
    color: DESKTOP_THEME.grey100,
  },
  skipButton: {
    paddingHorizontal: 12,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  skipLabel: {
    color: DARK_VIBRANT.textMuted,
  },
});
