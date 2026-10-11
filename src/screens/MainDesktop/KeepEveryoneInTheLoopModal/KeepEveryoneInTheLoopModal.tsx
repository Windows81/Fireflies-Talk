import { IconMessageCircle } from "@/assets/svg";
import { BaseModal } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { useDesktopConsentPolicy } from "@/features/consent-policy";
import {
  CONSENT_CHAT_BANNER_SEEN_FLAG_KEY,
  getLocalUserFlag,
  setLocalUserFlag,
} from "@/features/user-flags";
import { realRecordingsCountStore } from "@/features/live-record";
import {
  RecordingPreferencesDocument,
  useRecordingPreferencesQuery,
  useSetTeamsConsentEnabledMutation,
} from "@/graphql";
import { DARK_VIBRANT, DESKTOP_THEME } from "@/styles/color";
import {
  getActualPlatform,
  isDesktop,
  isMainDesktopWindow,
} from "@/utils/device";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { type FC, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MeetingChatMockPanel } from "./components/MeetingChatMockPanel";

// Web-only backdrop blur behind the modal — StyleSheet.create doesn't type
// backdropFilter, so cast it like the other desktop modals do (see WelcomeModal).
const webBlurStyle = StyleSheet.create({
  blur: { backdropFilter: "blur(8px)" } as never,
}).blur;

const selectRealRecordingsCount = (
  state: ReturnType<typeof realRecordingsCountStore.getState>,
) => state.count;

export const KeepEveryoneInTheLoopModal: FC = () => {
  const [seen, setSeen] = useState(
    () => !!getLocalUserFlag(CONSENT_CHAT_BANNER_SEEN_FLAG_KEY),
  );
  const realRecordingsCount = realRecordingsCountStore(
    selectRealRecordingsCount,
  );

  const { data, loading } = useRecordingPreferencesQuery({
    fetchPolicy: "cache-and-network",
    skip: seen || realRecordingsCount < 1,
  });
  const [setTeamsConsentEnabled, { loading: enabling }] =
    useSetTeamsConsentEnabledMutation();
  const chatRequired = useDesktopConsentPolicy().chat;

  const dismiss = useCallback(() => {
    setLocalUserFlag(CONSENT_CHAT_BANNER_SEEN_FLAG_KEY, true);
    setSeen(true);
  }, []);

  const handleSkip = useCallback(() => {
    tracker.track(TRACKING_EVENTS.DESKTOP_CONSENT_BANNER_SKIP_CLICKED);
    dismiss();
  }, [dismiss]);

  const handleEnable = useCallback(() => {
    tracker.track(TRACKING_EVENTS.DESKTOP_CONSENT_BANNER_ENABLE_CLICKED);

    // Accessibility permission drives Google Meet/Zoom chat injection — force
    // the system prompt now rather than waiting for the first recording to
    // silently fail on macOS.
    if (getActualPlatform() === "darwin") {
      window.electron?.browserMeetings?.requestAccessibilityPermission();
    }

    setTeamsConsentEnabled({
      variables: { enabled: true },
      optimisticResponse: {
        __typename: "Mutation",
        setTeamsConsentEnabled: {
          __typename: "RecordingPreferences",
          teamsConsentEnabled: true,
        },
      },
      update: (cache, { data: result }) => {
        const next = result?.setTeamsConsentEnabled;
        if (!next) return;
        cache.writeQuery({
          query: RecordingPreferencesDocument,
          data: {
            recordingPreferences: {
              __typename: "RecordingPreferences",
              teamsConsentEnabled: next.teamsConsentEnabled,
            },
          },
        });
      },
    })
      .catch(() => {
        // Apollo's onError link surfaces toasts globally.
      })
      .finally(dismiss);
  }, [setTeamsConsentEnabled, dismiss]);

  const alreadyEnabled = data?.recordingPreferences?.teamsConsentEnabled;
  // Nothing to announce when the notice is already on or admin-required;
  // settle the flag so announcements queued behind this one can show.
  const nothingToShow =
    !seen &&
    realRecordingsCount >= 1 &&
    !loading &&
    (chatRequired || alreadyEnabled === true);
  useEffect(() => {
    if (nothingToShow) dismiss();
  }, [nothingToShow, dismiss]);

  const shouldRender =
    isDesktop &&
    getActualPlatform() === "darwin" &&
    isMainDesktopWindow() &&
    !seen &&
    realRecordingsCount >= 1 &&
    !loading &&
    !chatRequired &&
    alreadyEnabled === false;

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
                <IconMessageCircle
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
                  Keep Everyone in the Loop
                </Text>
                <Text
                  variant="body1Regular"
                  color="textMuted"
                  fontSize={14}
                  lineHeightMultiplier={1.5}
                >
                  Auto-send chat message to participants when you start
                  capturing. Currently supported on Google Meet, Zoom and Teams
                  calls only.
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleEnable}
                disabled={enabling}
                style={styles.enableButton}
              >
                <Text variant="label2Weight" style={styles.enableLabel}>
                  Enable
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text variant="label2Weight" style={styles.skipLabel}>
                  Skip
                </Text>
              </Pressable>
            </View>
          </View>

          <MeetingChatMockPanel />
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
    justifyContent: "space-between",
    paddingBottom: 66,
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
    maxWidth: 285,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  enableButton: {
    width: 62,
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
    width: 56,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  skipLabel: {
    color: DARK_VIBRANT.textMuted,
  },
});
