import { Select } from "@/components/Input";
import { Text } from "@/components/Typography";
import { useDictationLastCapture } from "@/hooks/dictationLastCapture";
import { SYSTEM_DEFAULT_MICROPHONE_ID } from "@/hooks/dictationMicrophone";
import { useDictationMicrophoneSelection } from "@/hooks/useDictationMicrophoneSelection";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import { dictationMicrophoneStatus } from "./dictationMicrophoneStatus";

export const DictationSettingsMicrophone: FC = () => {
  const {
    selection,
    devices,
    systemDefaultLabel,
    status,
    selectedDeviceId,
    savedMicrophoneMissing,
    savedMicrophoneName,
    selectDeviceId,
  } = useDictationMicrophoneSelection();
  const lastCapture = useDictationLastCapture((state) => state.lastCapture);

  const options = [
    { value: SYSTEM_DEFAULT_MICROPHONE_ID, label: "System default" },
    ...(savedMicrophoneMissing
      ? [
          {
            value: selection.deviceId,
            label: `${savedMicrophoneName} (not connected)`,
          },
        ]
      : []),
    ...devices.map((device) => ({
      value: device.deviceId,
      label: device.label,
    })),
  ];

  const microphoneStatus = dictationMicrophoneStatus({
    selectedLabel: devices.find((d) => d.deviceId === selectedDeviceId)?.label,
    selectedDeviceId,
    savedMicrophoneMissing,
    savedMicrophoneName,
    systemDefaultLabel,
    lastCapture,
  });

  return (
    <SettingsGroup>
      <SettingField>
        <SettingLabel
          title="Microphone"
          description="Which mic to use. System default follows your computer."
          id="setting-label-dictation-microphone"
        />
        <Select
          value={selectedDeviceId}
          onValueChange={selectDeviceId}
          options={options}
          aria-labelledby="setting-label-dictation-microphone"
        />
        {status || microphoneStatus ? (
          <Text variant="body2Regular" color="textMuted">
            {status || microphoneStatus}
          </Text>
        ) : null}
      </SettingField>
    </SettingsGroup>
  );
};
