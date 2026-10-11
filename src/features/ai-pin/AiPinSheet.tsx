import { IconClose, IconDownload, IconRefreshCcw } from "@/assets/svg";
import { RecordIndicator } from "@/components/Animated";
import { BottomSheet } from "@/components/BottomSheet";
import { Button, IconButton } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AiPinModel } from "./AiPinModel";
import { formatRecordingDuration } from "./panel-state";
import type { AiPinControllerState } from "./types";

interface AiPinSheetProps {
  state: AiPinControllerState;
  onConnect: () => void;
  onDismiss: () => void;
  onRetry: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}

function sheetCopy(state: AiPinControllerState) {
  switch (state.sheetMode) {
    case "detected":
      return {
        eyebrow: "NEARBY",
        title: "Fireflies AI Pin detected",
        body: "Ready to connect",
      };
    case "connecting":
      return {
        eyebrow: "CONNECTING",
        title: "Fireflies AI Pin",
        body: "Connecting to your AI Pin",
      };
    case "connected":
      return {
        eyebrow: "CONNECTED",
        title: "Fireflies AI Pin",
        body: "Ready to sync",
      };
    case "recording":
      return {
        eyebrow: "RECORDING",
        title: "Fireflies AI Pin",
        body: "Audio is being captured on your AI Pin",
      };
    case "details":
      return {
        eyebrow: "YOUR DEVICE",
        title: "Fireflies AI Pin",
        body: "",
      };
    case "error":
      return {
        eyebrow:
          state.connectionState === "connected"
            ? "SYNC ISSUE"
            : "CONNECTION ISSUE",
        title: "Fireflies AI Pin",
        body: state.error ?? "Could not connect",
      };
    default:
      return { eyebrow: "", title: "", body: "" };
  }
}

export function AiPinSheet({
  state,
  onConnect,
  onDismiss,
  onRetry,
  onDisconnect,
  onSync,
}: AiPinSheetProps) {
  const theme = useTheme();
  const visible = state.sheetMode !== "hidden";
  const copy = sheetCopy(state);
  const connecting = state.sheetMode === "connecting";
  const details = state.sheetMode === "details";
  const recording = state.sheetMode === "recording";
  const error = state.sheetMode === "error";
  const connected = state.sheetMode === "connected" || details || recording;

  return (
    <BottomSheet.Root isOpen={visible} close={onDismiss}>
      <BottomSheet.View>
        <SafeAreaView edges={["bottom"]} style={styles.content}>
          <View style={styles.close}>
            <IconButton
              label="Close"
              size="sm"
              variant="neutral"
              Icon={IconClose}
              onPress={onDismiss}
            />
          </View>
          <AiPinModel active={state.recording?.active ?? false} />
          <Text
            variant="label2Weight"
            color={error ? "informationStaticRedText" : "textBrand"}
            textAlign="center"
          >
            {copy.eyebrow}
          </Text>
          <Text variant="title1Weight" textAlign="center" style={styles.title}>
            {copy.title}
          </Text>
          {copy.body && (
            <Text variant="body1Regular" color="textMuted" textAlign="center">
              {copy.body}
            </Text>
          )}

          {recording && (
            <View style={styles.statusList(theme)}>
              <View style={styles.statusRow}>
                <View style={styles.statusIcon(theme)}>
                  <RecordIndicator size={12} />
                </View>
                <Text variant="body2Weight" style={styles.statusCopy}>
                  Recording active
                </Text>
                <Text variant="body2Regular" color="textMuted">
                  {formatRecordingDuration(
                    state.recording?.durationMillis ?? 0,
                  )}
                </Text>
              </View>
            </View>
          )}

          {connected && (
            <View style={styles.battery}>
              <BatteryGauge level={state.batteryLevel} />
              <Text variant="body2Regular" color="textMuted">
                {state.batteryLevel == null ? "--" : `${state.batteryLevel}%`}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {state.sheetMode === "detected" && (
              <Button size="lg" onPress={onConnect}>
                Connect
              </Button>
            )}
            {connecting && (
              <Button size="lg" disabled>
                <ActivityIndicator color={theme.colors.textContrast} />
              </Button>
            )}
            {error && (
              <Button size="lg" Icon={IconRefreshCcw} onPress={onRetry}>
                Try again
              </Button>
            )}
            {details && (
              <>
                <Button size="lg" Icon={IconDownload} onPress={onSync}>
                  Sync now
                </Button>
                <Button size="lg" variant="text" onPress={onDisconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </View>
        </SafeAreaView>
      </BottomSheet.View>
    </BottomSheet.Root>
  );
}

function BatteryGauge({ level }: { level?: number }) {
  const theme = useTheme();
  const percentage = Math.max(0, Math.min(100, level ?? 0));
  const fillColor =
    percentage > 0 && percentage <= 20
      ? theme.colors.informationStaticRedSolid
      : theme.colors.textMuted;

  return (
    <View
      accessibilityLabel={
        level == null ? "Battery unavailable" : `${level}% battery`
      }
      accessibilityRole="image"
      style={styles.batteryGraphic}
    >
      <View style={styles.batteryShell(theme)}>
        <View
          style={[
            styles.batteryFill,
            { backgroundColor: fillColor, width: `${percentage}%` },
          ]}
        />
      </View>
      <View style={styles.batteryCap(theme)} />
    </View>
  );
}

const styles = createStyles({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  close: { alignItems: "flex-end", height: 34, justifyContent: "center" },
  title: { marginBottom: 6, marginTop: 6 },
  statusList: (theme) => ({
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  }),
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  statusIcon: (theme) => ({
    alignItems: "center",
    backgroundColor: theme.colors.layerBrandLight2,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  }),
  statusCopy: { flex: 1 },
  battery: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 16,
  },
  batteryGraphic: { alignItems: "center", flexDirection: "row" },
  batteryShell: (theme) => ({
    borderColor: theme.colors.textMuted,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 11,
    overflow: "hidden",
    padding: 1.5,
    width: 19,
  }),
  batteryFill: { borderRadius: 1, height: "100%" },
  batteryCap: (theme) => ({
    backgroundColor: theme.colors.textMuted,
    borderBottomRightRadius: 1,
    borderTopRightRadius: 1,
    height: 5,
    width: 2,
  }),
  actions: { gap: 8, marginTop: 20 },
});
