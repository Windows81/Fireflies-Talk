import { useRef } from "react";
import { Pressable, View } from "react-native";
import { createStyles, useTheme } from "@/styles";
import { YouHeaderButton } from "../../You";
import { Button } from "@/components/Button";
import { IconChevronDown, IconPlus, IconUpload } from "@/assets/svg";
import {
  CompactAudioView,
  useRecordActionsContext,
  useRecorder,
} from "@/features/live-record";
import { DesktopHeaderLeft } from "../../../features/navigation/components/Header/DesktopHeaderLeft";
import { Text } from "@/components/Typography";
import { MenuPopover } from "@/components/Menu";
import { useBooleanState } from "@/utils/states";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { pickDocument } from "@/features/global-modals/add-modal/components";
import { FreeMeetingsCounter, useBilling } from "@/features/billing";
import { UpgradeButton } from "../../You/components";
import { HoverTooltip } from "@/components/HoverTooltip";
import { DESKTOP_THEME } from "@/styles/color";
import { navigationRef } from "@/screens/RootNavigation";
import { RouteNames } from "@/constants";
import { useLocalSettings } from "@/features/settings";
import { formatGlobalShortcut } from "@/utils/keyboard-shortcuts";
import { openLiveNotes } from "./MeetingBanner/openLiveNotes";
import { useIsDictationOffered } from "@/hooks/useIsDictationOffered";
import { DesktopHomeTabBar, type DesktopHomeTab } from "./DesktopHomeTabBar";

const openRecordScreen = () => {
  navigationRef.navigate(RouteNames.Record);
};

const RecorderComponent = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);
  const streamingError = useRecorder((s) => s.status.streamingError);
  const meetingId = useRecorder((s) => s.context?.meetingId);
  const theme = useTheme();

  // Show the recorder component when recording is active or in a post-recording state
  const shouldShow =
    recordingState !== "inactive" ||
    streamingState !== "inactive" ||
    !!streamingError;

  if (!shouldShow) {
    return null;
  }

  // Reopen the live recording UI in whichever mode it was last shown (full
  // screen or the floating Live Assist panel), matching the home banner's
  // "View Notes". Falls back to the record screen before a meeting exists.
  const openNotes = () => {
    if (meetingId) {
      openLiveNotes(meetingId);
      return;
    }
    openRecordScreen();
  };

  return (
    <Button
      variant={"outlined"}
      onPress={openNotes}
      style={styles.noPaddingButton}
      size="sm"
    >
      <View style={styles.recorderContainer(theme)}>
        <CompactAudioView />
      </View>
    </Button>
  );
};

type MainDesktopHeaderProps = {
  showBackButton?: boolean;
  onBack?: () => void;
  recordButtonRef?: React.RefObject<View | null>;
  activeTab: DesktopHomeTab;
  onTabChange: (tab: DesktopHomeTab) => void;
  /** Tabs carrying a "Beta" badge. */
  betaTabs?: DesktopHomeTab[];
  /** True while the one-time consent setup still owes the user a showing. */
  consentSetupPending?: boolean;
  /** Hands that setup the start it should run once the user has answered. */
  onConsentSetupNeeded?: (start: () => void) => void;
};

export const MainDesktopHeader = ({
  showBackButton = false,
  onBack,
  recordButtonRef,
  activeTab,
  onTabChange,
  betaTabs,
  consentSetupPending,
  onConsentSetupNeeded,
}: MainDesktopHeaderProps) => {
  const theme = useTheme();
  const isDictationOffered = useIsDictationOffered();
  const { startRecording } = useRecordActionsContext();
  const [isMenuOpen, openMenu, closeMenu] = useBooleanState();
  const buttonRef = useRef<View>(null);
  const recordingState = useRecorder((s) => s.status.state);
  const { isFreeUser, reachedFreeMeetingsLimit } = useBilling();
  const { quickNoteShortcutKey } = useLocalSettings();

  const takeNotesShortcut = formatGlobalShortcut(quickNoteShortcutKey);

  // On the first click of an install the consent setup takes the click and
  // starts the notes itself once it has an answer.
  const handleTakeNotes = () => {
    if (consentSetupPending && onConsentSetupNeeded) {
      onConsentSetupNeeded(() => startRecording());
      return;
    }
    startRecording();
  };

  return (
    <View nativeID="drag-region" style={styles.draggableHeader}>
      {showBackButton && onBack && (
        <View nativeID="no-drag" style={styles.headerLeft}>
          <DesktopHeaderLeft
            canGoBack={true}
            onGoBack={onBack}
            tintColor={theme.colors.layerContrast}
          />
        </View>
      )}
      {!showBackButton && isDictationOffered && (
        <View nativeID="no-drag" style={styles.headerCenter}>
          <DesktopHomeTabBar
            activeTab={activeTab}
            onTabChange={onTabChange}
            betaTabs={betaTabs}
          />
        </View>
      )}
      {/* Only the action cluster is no-drag, so the rest of the 52px header
          stays a window drag region. -webkit-app-region inherits, so this
          covers the nested buttons/menus too. */}
      <View
        style={[
          styles.headerRight,
          showBackButton && styles.headerRightWithBackButton,
        ]}
      >
        <View nativeID="no-drag" style={styles.headerActions}>
          {isFreeUser && (
            <>
              <View style={styles.upgradeCluster}>
                <FreeMeetingsCounter />
                <UpgradeButton
                  variant={reachedFreeMeetingsLimit ? "critical" : "positive"}
                  source="desktop_header"
                  fullWidth={false}
                />
              </View>
              <View style={styles.seperator(theme)} />
            </>
          )}
          <View ref={recordButtonRef} collapsable={false}>
            {recordingState !== "inactive" ? (
              <RecorderComponent />
            ) : (
              <View style={styles.splitButton}>
                <HoverTooltip
                  label="Capture with your device audio"
                  description={`Captures transcript and notes only.\nNo audio, video, speaker names`}
                  shortcut={takeNotesShortcut}
                  position="bottom"
                  align="end"
                >
                  <Pressable
                    onPress={handleTakeNotes}
                    style={styles.splitButtonLeading(theme)}
                  >
                    <IconPlus
                      width={20}
                      height={20}
                      color={theme.colors.commandContrastDefault}
                    />
                    <Text variant="label2Weight" color="commandContrastDefault">
                      Take Notes
                    </Text>
                  </Pressable>
                </HoverTooltip>
                <Pressable
                  ref={buttonRef}
                  onPress={openMenu}
                  style={styles.splitButtonTrailing(theme)}
                >
                  <IconChevronDown
                    width={20}
                    height={20}
                    color={theme.colors.commandContrastDefault}
                  />
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.seperator(theme)} />
          <YouHeaderButton
            avatarSize={32}
            settingsContent={
              activeTab === "dictation" ? "dictation" : "meeting-preference"
            }
          />
        </View>
      </View>
      <MenuPopover
        isOpen={isMenuOpen}
        close={closeMenu}
        triggerRef={buttonRef}
        width={206}
        style={styles.quickCaptureDropdown}
      >
        <Pressable
          onPress={() => {
            pickDocument();
            closeMenu();
            tracker.track(TRACKING_EVENTS.DOCUMENT_PICKER_OPENED, {
              from: "home/add-button",
            });
          }}
        >
          {(state) => {
            const hovered = (state as { hovered?: boolean }).hovered;
            return (
              <View
                style={[
                  styles.quickCaptureItemContent,
                  hovered && styles.quickCaptureItemHovered,
                ]}
              >
                <IconUpload
                  width={16}
                  height={16}
                  color={DESKTOP_THEME.grey500}
                />
                <Text
                  variant="body2Regular"
                  style={styles.quickCaptureItemText}
                >
                  Upload audio or video
                </Text>
              </View>
            );
          }}
        </Pressable>
      </MenuPopover>
    </View>
  );
};

const styles = createStyles({
  draggableHeader: {
    flexDirection: "row",
    height: 52,
    backgroundColor: DESKTOP_THEME.grey1050,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  noPaddingButton: {
    paddingHorizontal: 0,
  },
  headerLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 2,
  },
  headerCenter: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    justifyContent: "center",
    zIndex: 2,
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  // Content-sized no-drag cluster; the empty header space beside it stays draggable.
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRightWithBackButton: {
    paddingLeft: 48,
  },
  recorderContainer: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderRadius: 4,
    height: 36,
    paddingHorizontal: 16,
    minWidth: 118,
  }),
  splitButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    overflow: "hidden",
  },
  splitButtonLeading: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
    height: 32,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
  }),
  splitButtonTrailing: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
    height: 32,
    width: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(250, 250, 255, 0.1)",
  }),
  seperator: (theme) => ({
    width: 1,
    height: 20,
    backgroundColor: theme.colors.interactiveSecondaryHover,
    alignSelf: "center",
  }),
  // The counter sits closer to its Upgrade CTA than the header's own 8px rhythm.
  upgradeCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickCaptureDropdown: {
    backgroundColor: DESKTOP_THEME.grey950,
    borderColor: DESKTOP_THEME.grey900,
    borderRadius: 8,
    paddingVertical: 4,
    boxShadow:
      "0px 12px 12px -4px rgba(16, 24, 40, 0.06), 0px 4px 6px -2px rgba(16, 24, 40, 0.04)",
  },
  quickCaptureItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 32,
  },
  quickCaptureItemHovered: {
    backgroundColor: DESKTOP_THEME.grey900,
  },
  quickCaptureItemText: {
    color: DESKTOP_THEME.grey500,
    letterSpacing: -0.16,
  },
});
