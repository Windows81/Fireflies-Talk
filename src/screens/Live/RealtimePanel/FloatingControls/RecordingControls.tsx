import { IconPause, IconStopSolid } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { HoverTooltip } from "@/components/HoverTooltip";
import { MenuPopover } from "@/components/Menu";
import { Separator } from "@/components/Separator";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { type Meeting } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { type FC, type ReactNode, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { getMeetingStartedAt } from "@/features/meeting";
import { useLiveScreenContext } from "../../Context/LiveScreenContext";
import { isLongRecording, useElapsedTimer } from "../hooks/useElapsedTimer";
import { MicSourcePill } from "./MicSourcePill";
import { StopRecordingConfirm } from "./StopRecordingConfirm";

export const RecordingControls: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const {
    endLiveMeeting,
    discardLiveMeeting,
    isEndingMeeting,
    puppetPauseState,
    isSelfRecordingSession,
  } = useLiveScreenContext();

  const startedAt = getMeetingStartedAt(meeting);
  const { isPaused, togglePause } = puppetPauseState;

  const elapsed = useElapsedTimer(startedAt, isPaused);

  const isHost = Boolean(user?.email && meeting.organizerEmail === user.email);

  const barRef = useRef<View>(null);
  const [isStopConfirmOpen, setStopConfirmOpen] = useState(false);

  // The recording pill (timer + pause/stop) is host-only. Non-hosts (e.g.
  // bot-call participants) can't control the recording, so the whole pill is
  // hidden rather than shown without controls.
  if (!isHost) return null;

  // Short recordings ask before saving; longer ones (> 5 min) save directly.
  const handleStop = () => {
    if (isEndingMeeting) return;
    if (isLongRecording(elapsed)) {
      endLiveMeeting();
      return;
    }
    setStopConfirmOpen(true);
  };

  const handleSave = () => {
    setStopConfirmOpen(false);
    endLiveMeeting();
  };

  // Discard: stop the recorder without uploading, delete the meeting, and
  // close back to the home screen — the recording is never saved.
  const handleDelete = () => {
    setStopConfirmOpen(false);
    discardLiveMeeting();
  };

  return (
    <>
      <View ref={barRef} style={styles.bar(theme)}>
        {isSelfRecordingSession && (
          <>
            <MicSourcePill />
            <Separator style={styles.separator} />
          </>
        )}
        <Text
          variant="body2Regular"
          color="commandHintDefault"
          style={styles.timer}
        >
          {elapsed}
        </Text>
        {isPaused ? (
          <Pressable
            onPress={togglePause}
            disabled={isEndingMeeting}
            accessibilityRole="button"
            accessibilityLabel="Resume recording"
            style={styles.resumeButton}
          >
            <Text variant="body2Weight" style={styles.resumeText}>
              Resume
            </Text>
          </Pressable>
        ) : (
          <View style={styles.controls}>
            <ControlButton
              tooltip="Pause recording"
              onPress={togglePause}
              disabled={isEndingMeeting}
            >
              <IconPause
                width={22}
                height={22}
                color={theme.colors.commandNeutralDefault}
              />
            </ControlButton>
            <ControlButton
              tooltip="Stop recording"
              onPress={handleStop}
              disabled={isEndingMeeting}
            >
              <IconStopSolid
                width={30}
                height={30}
                color={theme.colors.informationStaticRedText}
              />
            </ControlButton>
          </View>
        )}
      </View>
      <MenuPopover
        isOpen={isStopConfirmOpen}
        close={() => setStopConfirmOpen(false)}
        triggerRef={barRef}
        placement="top"
        width={380}
        style={styles.confirmPopover}
      >
        <StopRecordingConfirm onSave={handleSave} onDelete={handleDelete} />
      </MenuPopover>
    </>
  );
};

// Icon control with a subtle hover surface and a tooltip. Used for pause/stop.
const ControlButton: FC<{
  tooltip: string;
  onPress: () => void;
  disabled: boolean;
  children: ReactNode;
}> = ({ tooltip, onPress, disabled, children }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();
  return (
    <HoverTooltip label={tooltip} position="top" disabled={disabled}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={tooltip}
        style={[
          styles.iconButton,
          !disabled && isHovered && styles.iconButtonHover(theme),
        ]}
        {...webHoverProps}
      >
        {children}
      </Pressable>
    </HoverTooltip>
  );
};

const styles = createStyles({
  // The popover only provides positioning + outside-click dismissal; the card's
  // own surface is StopRecordingConfirm, so neutralize the menu chrome here.
  confirmPopover: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    overflow: "visible",
  },
  resumeButton: {
    backgroundColor: DESKTOP_THEME.purple1100,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeText: {
    color: DESKTOP_THEME.purple300,
  },
  bar: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 999,
    backgroundColor: theme.colors.layerStrong,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
  }),
  separator: {
    width: 1,
    height: 16,
  },
  timer: {
    fontVariant: ["tabular-nums"],
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  // Fixed circular hit area sized to the stop glyph so the hover surface never
  // grows the control bar's height (matches the Figma 32px button footprint).
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 999,
  },
  iconButtonHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
});
