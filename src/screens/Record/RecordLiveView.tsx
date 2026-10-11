import { IconKeyboardDown } from "@/assets/svg";
import { IconButton } from "@/components/Button";
import {
  RecordControlsPill,
  RecordPausedHint,
  useRecordActionsContext,
} from "@/features/live-record";
import { createStyles, useTheme, vars } from "@/styles";
import { useCallback, useState, type FC } from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecordAppBar, type RecordTab } from "./components/RecordAppBar";
import { RecordAskFredBar } from "./components/RecordAskFredBar";
import { RecordNotesTab } from "./components/RecordNotesTab";
import { RecordTranscriptTab } from "./components/RecordTranscriptTab";
import type { RecordViewSource } from "./types";
import { useRecordLiveTranscript } from "./useRecordLiveTranscript";

const IS_ANDROID = Platform.OS === "android";
// No soft keyboard on web, so the controls never need to yield their space.
const IS_WEB = Platform.OS === "web";
const KEYBOARD_FADE_MS = 150;

let lastActiveTab: RecordTab = "notes";

/**
 * The unified recording/live-meeting UI. A plain top-to-bottom column: app
 * bar, tabs (which take the remaining height), controls, AskFred bar. Nothing
 * is absolutely positioned, so nothing can overlap the typing area.
 *
 * Rendered by the Record screen and the floating card's sheet (recorder
 * mode), and by the Live route (live-meeting mode).
 */
export const RecordLiveView: FC<{
  source: RecordViewSource;
  onBack: () => void;
  onDismiss?: () => void;
}> = ({ source, onBack, onDismiss }) => {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<RecordTab>(lastActiveTab);

  const liveMeeting =
    source.kind === "live-meeting" ? source.meeting : undefined;

  const activeTab = liveMeeting ? selectedTab : "notes";

  const onTabChange = useCallback((tab: RecordTab) => {
    lastActiveTab = tab;
    setSelectedTab(tab);
  }, []);

  const { groupedCaptions, loading: transcriptLoading } =
    useRecordLiveTranscript({
      meetingId: liveMeeting?.id ?? "",
      isLive: !!liveMeeting,
      onMeetingEnded:
        source.kind === "live-meeting" ? source.onMeetingEnded : undefined,
    });

  const keyboard = useAnimatedKeyboard();
  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  useAnimatedReaction(
    () => keyboard.height.value > 0,
    (isOpen, wasOpen) => {
      if (IS_ANDROID && isOpen !== wasOpen) runOnJS(setIsKeyboardOpen)(isOpen);
    },
  );
  const isTyping = !IS_WEB && (IS_ANDROID ? isKeyboardOpen : isEditingNotes);

  return (
    <Animated.View style={[styles.root(theme), keyboardStyle]}>
      <RecordAppBar
        source={source}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onBack={onBack}
        onDiscarded={onDismiss}
      />
      {/* Tapping the screen outside the inputs puts the keyboard away; the
          inputs claim their own touches so a tap there only moves the caret.
          Not on web: react-native-web lets the click on an input bubble up
          here, and Keyboard.dismiss would blur it as soon as it gained focus. */}
      <Pressable
        style={styles.tabBody}
        onPress={IS_WEB ? undefined : Keyboard.dismiss}
        accessible={false}
      >
        <View style={[styles.tabPane, activeTab !== "notes" && styles.hidden]}>
          <RecordNotesTab
            source={source}
            onEditingChange={IS_ANDROID ? undefined : setIsEditingNotes}
          />
        </View>
        {liveMeeting && (
          <View
            style={[
              styles.tabPane,
              activeTab !== "transcript" && styles.hidden,
            ]}
          >
            <RecordTranscriptTab
              groupedCaptions={groupedCaptions}
              loading={transcriptLoading}
            />
          </View>
        )}
      </Pressable>
      {isTyping && <KeyboardDismissButton />}
      {!isTyping && (
        <Animated.View
          style={[
            styles.bottomControls,
            { paddingBottom: Math.max(safeAreaInsets.bottom, 12) },
          ]}
          entering={IS_ANDROID ? undefined : FadeIn.duration(140)}
          exiting={IS_ANDROID ? undefined : FadeOut.duration(120)}
        >
          {source.kind === "recorder" && (
            <>
              <RecordPausedHint />
              <RecorderEndControls onDismiss={onDismiss} />
            </>
          )}
          <RecordAskFredBar source={source} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const KeyboardDismissButton: FC = () => (
  <Animated.View
    style={styles.keyboardDismissRow}
    entering={FadeIn.duration(KEYBOARD_FADE_MS)}
    exiting={FadeOut.duration(KEYBOARD_FADE_MS)}
  >
    <IconButton
      label="Hide keyboard"
      Icon={IconKeyboardDown}
      variant="outlined"
      iconSize={22}
      iconColor="textMuted"
      style={styles.keyboardDismissButton}
      onPress={Keyboard.dismiss}
    />
  </Animated.View>
);

const RecorderEndControls: FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
  const { stopRecording } = useRecordActionsContext();

  const onEnd = useCallback(async () => {
    const stopped = await stopRecording();
    if (stopped) onDismiss?.();
  }, [stopRecording, onDismiss]);

  return <RecordControlsPill onEnd={onEnd} />;
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  }),
  tabBody: {
    flex: 1,
  },
  tabPane: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
  keyboardDismissButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    ...vars.elevations[2],
  },
  keyboardDismissRow: {
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bottomControls: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
});
