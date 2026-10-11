import {
  IconCheckCheck,
  IconComment,
  IconGoogleMeetLogo,
  IconMsTeamsLogo,
  IconVolumeOutline,
  IconZoomLogo,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { openSystemExtensionSettings } from "@/features/camera-consent";
import { anyConsentRequired } from "@/features/consent-policy";
import {
  type ConsentSetupOutcome,
  trackConsentSetupAnswered,
  trackConsentSetupShown,
} from "@/features/recording-consent";
import { Logger } from "@/logger";
import { ThemeContext, createStyles, desktopUiTheme, useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import {
  type FC,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ConsentAudioPreviewButton } from "./ConsentAudioPreviewButton";
import { ConsentSetupOption } from "./ConsentSetupOption";
import { ConsentSetupVisual } from "./ConsentSetupVisual";
import { CAMERA_STEPS } from "./consentCameraSteps";
import { useConsentSetupPromptStore } from "./consentSetupPrompt.store";
import { useConsentSetupOptions } from "./useConsentSetupOptions";

const log = new Logger("ConsentSetup");

interface ConsentSetupCardProps {
  /** Hides the card and starts the recording it is holding. */
  onFinished: (outcome: ConsentSetupOutcome) => void;
}

/**
 * One-time consent setup, centred over the desktop home screen. It holds the
 * first "Take Notes" click of an install and starts the notes itself once the
 * user has answered — however they answer, so the click is never swallowed.
 *
 * While the team requires the camera notice and this device has not turned it
 * on, it is also up on every launch and cannot be closed until the camera
 * works.
 */
export const ConsentSetupCard: FC<ConsentSetupCardProps> = ({ onFinished }) => {
  const { breakpoint } = useTheme();
  // Designed against the desktop palette, which the main window does not carry
  // ambiently — the same wrapper the notepad and live panel use.
  const theme = useMemo(
    () => ({ ...desktopUiTheme, breakpoint }),
    [breakpoint],
  );

  const {
    available,
    cameraReady,
    cameraSetupOwed,
    choices,
    required,
    snapshot,
    setChoice,
    apply,
  } = useConsentSetupOptions({
    firstRun: useConsentSetupPromptStore((state) => state.firstRun),
  });
  const anyRequired = anyConsentRequired(required);
  const holdingStart = useConsentSetupPromptStore(
    (state) => state.pendingStart !== null,
  );
  const [applying, setApplying] = useState(false);
  const [showCameraSteps, setShowCameraSteps] = useState(false);
  const answered = useRef(false);

  const CONTINUE_DELAY_MS = 10_000;
  const [timerReady, setTimerReady] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    if (showCameraSteps) return;
    requestAnimationFrame(() => setTimerStarted(true));
    const timer = setTimeout(() => setTimerReady(true), CONTINUE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showCameraSteps]);

  useEffect(trackConsentSetupShown, []);

  /**
   * Closes the card, reporting how it was answered. Every way out ends here and
   * more than one can run in sequence — the approval can land in the same tick
   * as a click, and the unmount answers on the way out — so the report is taken
   * once while the close itself stays idempotent.
   */
  const finish = useCallback(
    (outcome: ConsentSetupOutcome) => {
      if (!answered.current) {
        answered.current = true;
        trackConsentSetupAnswered({
          outcome,
          snapshot,
          cameraApprovalNeeded: showCameraSteps,
        });
      }
      onFinished(outcome);
    },
    [onFinished, showCameraSteps, snapshot],
  );

  const handleContinue = useCallback(async () => {
    setApplying(true);
    // Assumed ready, so a failure to apply cannot strand the user on a second
    // step about a camera we never managed to ask for — unless the admin
    // requires it, when nothing may get past the card without one.
    let cameraWorks = !cameraSetupOwed;
    try {
      cameraWorks = (await apply()).cameraReady;
    } catch (error) {
      // Whatever failed keeps its own surface in Settings; holding the recording
      // hostage to it would be the worse outcome.
      log.warn("Consent setup failed to apply", { error });
    } finally {
      setApplying(false);
    }

    // Only when the user actually asked for the camera notice and it is not
    // working yet. macOS puts up its own "Camera Extension Blocked" alert at
    // this point, so System Settings is deliberately NOT opened from here —
    // two windows racing to the same pane is what made this a mess.
    if (available.camera && choices.camera && !cameraWorks) {
      // Windows has no approval step to walk through: the install itself
      // failed, and Continue tries it again.
      if (cameraSetupOwed && getActualPlatform() === "win32") {
        toast({
          type: "error",
          title: "Couldn't turn on the Fireflies camera",
          message: "Try again in a moment.",
        });
        return;
      }
      setShowCameraSteps(true);
      return;
    }

    finish("continue");
  }, [apply, available.camera, cameraSetupOwed, choices.camera, finish]);

  // Approval happens outside the app, so the status re-read on window focus is
  // what tells us the user is done.
  const finishOnApproval = useEffectEvent(() => finish("camera-approved"));
  useEffect(() => {
    if (showCameraSteps && cameraReady) finishOnApproval();
  }, [showCameraSteps, cameraReady]);

  // Something can navigate the main window out from under the card — a
  // notification click, a meeting going live. Answering on the way out honours
  // the recording instead of leaving it held by a card nobody can reach. A no-op
  // when the user answered, because the start is only ever handed out once.
  const finishOnTeardown = useEffectEvent(() => finish("interrupted"));
  useEffect(() => () => finishOnTeardown(), []);

  return (
    <ThemeContext.Provider value={theme}>
      <View style={styles.overlay}>
        {/* Dismissing is "start without these", not "cancel": the user asked
            for notes, so the click still gets honoured. Not while the admin's
            camera notice is still off. */}
        <Pressable
          style={styles.scrim(theme)}
          onPress={cameraSetupOwed ? undefined : () => finish("dismissed")}
          aria-hidden
        />
        <View style={styles.card(theme)}>
          <ConsentSetupVisual />
          <View style={styles.body}>
            <View style={styles.header}>
              <View style={styles.titles}>
                <Text
                  variant="heading4Weight"
                  color="textPrimary"
                  textAlign="center"
                >
                  {showCameraSteps
                    ? "Turn on the Fireflies camera"
                    : anyRequired
                      ? "Your admin is requesting you to enable recording notices"
                      : "Get consent while taking notes"}
                </Text>
                <Text
                  variant="body2Regular"
                  color="textHint"
                  textAlign="center"
                >
                  {showCameraSteps
                    ? holdingStart
                      ? "macOS keeps camera extensions switched off until you allow this one. Your notes start as soon as you do."
                      : "macOS keeps camera extensions switched off until you allow this one."
                    : anyRequired
                      ? "Your workspace admin requires some of these notices. Set the rest as you prefer."
                      : "Set your consent preferences. If disabled, please make sure to let participants know"}
                </Text>
              </View>

              {showCameraSteps ? (
                <View style={styles.cameraSteps}>
                  {CAMERA_STEPS.map((step, index) => (
                    <View key={step} style={styles.cameraStep}>
                      <Text variant="body2Regular" color="textHint">
                        {index + 1}.
                      </Text>
                      <Text variant="body2Regular" color="textSecondary">
                        {step}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.cameraStepActions}>
                    <Button
                      variant="outlined"
                      size="md"
                      onPress={openSystemExtensionSettings}
                    >
                      Open Login Items & Extensions
                    </Button>
                    {/* The requirement is the admin's; the gate would refuse the held start anyway, so the button would only lead back here. */}
                    {!required.camera && (
                      <Button
                        variant="primary"
                        size="md"
                        onPress={() => finish("start-anyway")}
                      >
                        Start notes anyway
                      </Button>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.options}>
                  <ConsentSetupOption
                    Icon={IconVolumeOutline}
                    label="Auto-play consent message"
                    accessory={<ConsentAudioPreviewButton />}
                    checked={choices.audio}
                    onCheckedChange={(value) => setChoice("audio", value)}
                    required={required.audio}
                  />
                  {available.camera && (
                    <ConsentSetupOption
                      Icon={IconCheckCheck}
                      label="Inform 'Taking notes' when camera's on"
                      checked={choices.camera}
                      onCheckedChange={(value) => setChoice("camera", value)}
                      required={required.camera}
                    />
                  )}
                  {available.chat && (
                    <ConsentSetupOption
                      Icon={IconComment}
                      label="Notify in meeting chat"
                      note="— only"
                      checked={choices.chat}
                      onCheckedChange={(value) => setChoice("chat", value)}
                      required={required.chat}
                    >
                      <View style={styles.apps}>
                        <IconGoogleMeetLogo width={16} height={16} />
                        <IconZoomLogo width={16} height={16} />
                        <IconMsTeamsLogo width={16} height={16} />
                      </View>
                    </ConsentSetupOption>
                  )}
                </View>
              )}
            </View>

            {!showCameraSteps && (
              <View style={styles.continueWrapper}>
                <Button
                  variant="primary"
                  size="md"
                  style={styles.continue}
                  onPress={handleContinue}
                  disabled={!timerReady || applying}
                >
                  Continue
                </Button>
                {!timerReady && (
                  <View style={styles.progressTrack(theme)}>
                    <View
                      style={[
                        styles.progressBar(theme),
                        timerStarted && styles.progressBarFill,
                      ]}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </ThemeContext.Provider>
  );
};

const styles = createStyles({
  // Above the header, which owns the only other z-index on this screen.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scrim: (theme) => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.miscellaneousSkeletonBackground,
    backdropFilter: "blur(3px)",
  }),
  card: (theme) => ({
    width: 520,
    maxHeight: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.layerSubtle,
  }),
  body: {
    paddingTop: 24,
    paddingHorizontal: 48,
    paddingBottom: 48,
    gap: 48,
    alignItems: "center",
  },
  header: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 32,
  },
  titles: {
    alignItems: "center",
    gap: 4,
    maxWidth: 396,
  },
  options: {
    alignSelf: "stretch",
    gap: 12,
  },
  // Stands in for the options while the extension is waiting to be allowed, so
  // the card keeps its shape instead of collapsing to a title.
  cameraSteps: {
    alignSelf: "stretch",
    gap: 8,
  },
  cameraStep: {
    flexDirection: "row",
    gap: 8,
  },
  cameraStepActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingTop: 16,
  },
  apps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.33,
  },
  continueWrapper: {
    width: 124,
    position: "relative",
  },
  continue: {
    width: 124,
  },
  progressTrack: (theme) => ({
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: theme.colors.interactivePrimaryDisabled,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: "hidden",
  }),
  progressBar: (theme) => ({
    height: "100%",
    width: "0%",
    backgroundColor: theme.colors.interactivePrimaryDefault,
    borderRadius: 4,
  }),
  progressBarFill: {
    width: "100%",
    transition: "width 10000ms linear",
  },
});
