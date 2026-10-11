import { IconCheck, IconChevronDown, IconMic } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { MenuItem, MenuPopover } from "@/components/Menu";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useRef, useState, type FC } from "react";
import { Pressable } from "react-native";
import type { View } from "react-native";
import { useAudioInputDevices } from "../hooks/useAudioInputDevices";

// The mic pill sits inside the recording controls bar (8px padding + 2px
// border). Lift the menu past the bar so it floats above it with a small gap
// instead of overlapping the bar's top edge.
const RECORDING_BAR_CLEARANCE = 16;

export const MicSourcePill: FC = () => {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { isHovered, webHoverProps } = useWebHover();
  const { devices, selectedDeviceId, selectDevice, currentLabel } =
    useAudioInputDevices();

  const handleSelect = (deviceId: string) => {
    selectDevice(deviceId);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        style={[styles.pill, isHovered && styles.pillHover(theme)]}
        {...webHoverProps}
      >
        <IconMic
          width={16}
          height={16}
          color={theme.colors.commandHintDefault}
        />
        <Text
          variant="body2Regular"
          color="commandHintDefault"
          numberOfLines={1}
          style={styles.label}
        >
          {currentLabel}
        </Text>
        <IconChevronDown
          width={16}
          height={16}
          color={theme.colors.commandHintDefault}
        />
      </Pressable>
      <MenuPopover
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        triggerRef={triggerRef}
        width={240}
        placement="top"
        offset={RECORDING_BAR_CLEARANCE}
      >
        {devices.map((device) => (
          <MenuItem
            key={device.deviceId}
            label={device.label}
            onPress={() => handleSelect(device.deviceId)}
            icon={
              device.deviceId === selectedDeviceId ? (
                <IconCheck
                  width={16}
                  height={16}
                  color={theme.colors.commandNeutralDefault}
                />
              ) : undefined
            }
          />
        ))}
      </MenuPopover>
    </>
  );
};

const styles = createStyles({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  label: {
    flexShrink: 1,
    maxWidth: 110,
  },
});
