import { ConfirmationDialog } from "@/components/Dialog";
import { Select, type SelectOption } from "@/components/Input";
import { useAuth } from "@/features/auth";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import {
  DownloadStatus,
  MediaDownloadMode,
  useDownloads,
  wipeAutoCache,
} from "@/features/downloads";
import { useTheme } from "@/styles";
import { pluralize } from "@/utils/pluralize";
import { useBooleanState } from "@/utils/states";
import Slider from "@react-native-community/slider";
import prettyBytes from "pretty-bytes";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

const CACHE_SIZE_STEPS = [100e6, 250e6, 500e6, 1e9, 2e9, 3e9, 5e9, 10e9];
const DEFAULT_STEP_INDEX = 2; // 512 MB

const MEDIA_MODE_OPTIONS: SelectOption<MediaDownloadMode>[] = [
  { label: "Prefer video", value: MediaDownloadMode.VIDEO },
  { label: "Prefer audio", value: MediaDownloadMode.AUDIO },
  { label: "Off", value: MediaDownloadMode.OFF },
];

// Live caching feedback: the persisted index is reactive, so completed vs
// total auto entries (plus the in-flight fraction) is all we need. Scoped to
// the current user — another account's leftovers must not show here.
const AutoCacheProgress: FC = () => {
  const theme = useTheme();
  const index = useDownloads((s) => s.index);
  const userId = useAuth((s) => s.user?.id);

  const autos = index.filter((e) => !e.isManual && e.userId === userId);
  if (autos.length === 0) return null;

  const completed = autos.filter(
    (e) => e.status.state === DownloadStatus.COMPLETE,
  ).length;

  if (completed === autos.length) {
    const cachedBytes = autos.reduce(
      (sum, e) =>
        e.status.state === DownloadStatus.COMPLETE
          ? sum + e.status.sizeBytes
          : sum,
      0,
    );
    return (
      <Text variant="label2Regular" color="textMuted">
        {autos.length} recent {pluralize("meeting", autos.length)} cached ·{" "}
        {prettyBytes(cachedBytes)}
      </Text>
    );
  }

  const partial = autos.reduce(
    (sum, e) =>
      e.status.state === DownloadStatus.IN_PROGRESS
        ? sum + e.status.progress
        : sum,
    0,
  );
  const fraction = (completed + partial) / autos.length;

  return (
    <View style={styles.progressWrapper}>
      <Text variant="label2Regular" color="textMuted">
        Caching recent meetings… {completed} of {autos.length}
      </Text>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.layerStrong },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.layerBrand,
              width: `${Math.round(fraction * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const DownloadsSettings: FC = () => {
  const theme = useTheme();
  const settings = useDownloads((s) => s.settings);
  const updateSettings = useDownloads((s) => s.updateSettings);
  const cacheBytes = useDownloads((s) => s.getCachedMediaSize());
  const [isOpenWipeDialog, openWipeDialog, closeWipeDialog] = useBooleanState();

  const stepIndex = CACHE_SIZE_STEPS.indexOf(settings.maxCacheBytes);

  return (
    <SettingsGroup title="Offline meetings">
      <SettingField>
        <SettingRow>
          <SettingLabel
            id="setting-label-auto-download"
            title="Auto-download recent meetings"
            description="Keep your latest meetings available offline"
          />
          <Switch
            value={settings.autoDownloadEnabled}
            onValueChange={(value) =>
              value
                ? updateSettings({ autoDownloadEnabled: true })
                : openWipeDialog()
            }
            aria-labelledby="setting-label-auto-download"
          />
        </SettingRow>
        {settings.autoDownloadEnabled && <AutoCacheProgress />}
      </SettingField>
      <SettingField>
        <SettingLabel id="setting-label-downloads-wifi" title="On Wi-Fi" />
        <Select
          value={settings.wifiMode}
          onValueChange={(wifiMode) => updateSettings({ wifiMode })}
          options={MEDIA_MODE_OPTIONS}
          aria-labelledby="setting-label-downloads-wifi"
        />
      </SettingField>
      <SettingField>
        <SettingLabel
          id="setting-label-downloads-cellular"
          title="On mobile data"
        />
        <Select
          value={settings.cellularMode}
          onValueChange={(cellularMode) => updateSettings({ cellularMode })}
          options={MEDIA_MODE_OPTIONS}
          aria-labelledby="setting-label-downloads-cellular"
        />
      </SettingField>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Maximum cache size"
            description="Caps auto-downloaded meetings only. Saved meetings do not count."
          />
          <Text variant="label2Weight" color="textSecondary">
            {prettyBytes(settings.maxCacheBytes)}
          </Text>
        </SettingRow>
        <Slider
          minimumValue={0}
          maximumValue={CACHE_SIZE_STEPS.length - 1}
          step={1}
          value={stepIndex === -1 ? DEFAULT_STEP_INDEX : stepIndex}
          onValueChange={(value) =>
            updateSettings({ maxCacheBytes: CACHE_SIZE_STEPS[value] })
          }
          minimumTrackTintColor={theme.colors.layerBrand}
          maximumTrackTintColor={theme.colors.borderStaticSubtle}
          thumbTintColor={theme.colors.layerBrand}
          aria-label="Maximum cache size"
        />
      </SettingField>
      <ConfirmationDialog
        title="Turn off auto-download?"
        isOpen={isOpenWipeDialog}
        close={closeWipeDialog}
        confirmText="Turn off"
        onConfirm={() => {
          wipeAutoCache();
          updateSettings({ autoDownloadEnabled: false });
        }}
      >
        {`This clears ${prettyBytes(cacheBytes)} of automatically cached meetings from this device. Meetings you saved offline are kept.`}
      </ConfirmationDialog>
    </SettingsGroup>
  );
};

const styles = StyleSheet.create({
  progressWrapper: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
