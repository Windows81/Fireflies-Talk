import { IconSquare } from "@/assets/svg";
import {
  FloatingSheetCard,
  FloatingSheetPanes,
} from "@/components/FloatingSheetCard";
import { AnimatedAudioWave } from "@/components/AnimatedAudioWave";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { RecordLiveView } from "@/screens/Record/RecordLiveView";
import { createStyles, useTheme, vars } from "@/styles";
import {
  haptics,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from "@/utils/haptics";
import { useScreenType } from "@/utils/screen-type";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, type FC } from "react";
import { Platform, Pressable, View } from "react-native";
import {
  RecordActionsContextProvider,
  useRecordActionsContext,
} from "../RecordActionsContext";
import { recordEventEmitter } from "../events";
import { RECORD_STARTING_LABEL, useRecordPhase } from "../record-phase.store";
import { useRecorder } from "../record.store";
import { useIsRecordSessionActive } from "../useIsRecordSessionActive";
import { getUserRecordingTitle } from "../utils";
import { useRecorderUploadStatus } from "./RecordControlsPill";
import { RecordingDurationText } from "./RecordingDurationText";
import { RecordingWaveform } from "./RecordingWaveform";

const COMPACT_HEIGHT = 84;

/**
 * Full-width recording bar docked above the bottom navigation while a
 * recording (or its upload) is active and the Record screen is not.
 * Tapping or dragging it up expands the sheet into the live recording UI
 * in place. FloatingSheetCard owns the sheet mechanics.
 */
const LiveRecordFloatingCardContent: FC = () => {
  const isSessionActive = useIsRecordSessionActive();
  const screenType = useScreenType(RouteNames.Record);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleExpandRequest = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleCollapseRequest = useCallback(() => {
    haptics.impact(ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.collapse();
  }, []);

  useEffect(() => {
    recordEventEmitter.on("expandFloatingCard", handleExpandRequest);
    return () =>
      recordEventEmitter.off("expandFloatingCard", handleExpandRequest);
  }, [handleExpandRequest]);

  // Success is for the recording actually wrapping up, so it tracks the
  // session going quiet — not the bar hiding, which also happens on mount and
  // whenever the user navigates to the Record screen.
  const wasSessionActiveRef = useRef(false);
  useEffect(() => {
    if (isSessionActive) {
      wasSessionActiveRef.current = true;
      return;
    }
    if (!wasSessionActiveRef.current) return;
    wasSessionActiveRef.current = false;
    haptics.notification(NotificationFeedbackType.Success);
  }, [isSessionActive]);

  return (
    <FloatingSheetCard
      activeRoute={RouteNames.Record}
      isVisible={screenType !== "active" && isSessionActive}
      compactHeight={COMPACT_HEIGHT}
      sheetRef={bottomSheetRef}
    >
      <FloatingSheetPanes
        compactStyle={styles.compactContent}
        compact={<FloatingRecordBar onPress={handleExpandRequest} />}
        renderExpanded={() => (
          <RecordLiveView
            source={{ kind: "recorder" }}
            onBack={handleCollapseRequest}
          />
        )}
      />
    </FloatingSheetCard>
  );
};

/**
 * Collapsed bar: wave animation · title + elapsed time · End.
 * Tapping anywhere outside the End button expands into the recording UI.
 */
const FloatingRecordBar: FC<{ onPress: () => void }> = ({ onPress }) => {
  const theme = useTheme();
  const recordingState = useRecorder((s) => s.status.state);
  const phase = useRecordPhase();
  const title = useRecorder(
    (s) => getUserRecordingTitle(s.context) || "New Recording",
  );
  const uploadStatus = useRecorderUploadStatus();
  const { stopRecording } = useRecordActionsContext();

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.barMain}
        onPress={onPress}
        aria-label="Open recording"
        role="button"
      >
        {/* Metering is native-only, so mobile web gets the simple wave. */}
        {Platform.OS !== "web" ? (
          <View style={styles.waveformClip(theme)}>
            <RecordingWaveform width={72} height={40} />
          </View>
        ) : (
          <AnimatedAudioWave recordingState={recordingState} />
        )}
        <View style={styles.barTexts}>
          <Text variant="body2Weight" color="textPrimary" numberOfLines={1}>
            {title}
          </Text>
          {phase === "starting" ? (
            <Text variant="body2Regular" color="textMuted" numberOfLines={1}>
              {RECORD_STARTING_LABEL}
            </Text>
          ) : recordingState === "inactive" ? (
            <Text
              variant="body2Regular"
              color={
                uploadStatus.isError ? "commandDangerDefault" : "textMuted"
              }
              numberOfLines={1}
            >
              {uploadStatus.text}
            </Text>
          ) : (
            <RecordingDurationText variant="body2Regular" color="textMuted" />
          )}
        </View>
      </Pressable>
      {phase === "recording" && (
        <Pressable
          style={styles.endButton(theme)}
          onPress={() => {
            haptics.impact(ImpactFeedbackStyle.Light);
            stopRecording();
          }}
          aria-label="End recording"
          role="button"
        >
          <IconSquare
            width={16}
            height={16}
            fill={theme.colors.commandDangerDefault}
            stroke="transparent"
          />
          <Text variant="label2Weight" color="commandDangerDefault">
            End
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export const LiveRecordFloatingCard = () => {
  return (
    <RecordActionsContextProvider>
      <LiveRecordFloatingCardContent />
    </RecordActionsContextProvider>
  );
};

const styles = createStyles({
  compactContent: {
    height: 42,
    paddingBottom: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  barMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    paddingLeft: 16,
  },
  waveformClip: (theme) => ({
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: theme.colors.layerSubtle,
  }),
  barTexts: {
    flex: 1,
  },
  endButton: (theme) => ({
    // Android turns this elevation into a hard shadow against the bar it
    // already sits on, so only the other platforms get it.
    ...(Platform.OS !== "android" && vars.elevations[1]),
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.interactiveDangerSecondaryDefault,
  }),
});
