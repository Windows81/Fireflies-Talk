import { IconCheck, IconChevronDown } from "@/assets/svg/svgs.gen";
import { Button } from "@/components/Button";
import { MicDeviceIcon } from "../components/MicDeviceIcon";
import { useMicMeter, type AudioDevice } from "../useMicMeter";
import { Text } from "@/components/Typography";
import { SYSTEM_DEFAULT_MICROPHONE_ID } from "@/hooks/dictationMicrophone";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { useCallback, useState, type FC } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { OnboardingCardLayout } from "../OnboardingCardLayout";

interface MicTestStepProps {
  onNext: () => void;
  onBack: () => void;
}

const BAR_COUNT = 15;

const SYSTEM_DEFAULT_OPTION: AudioDevice = {
  deviceId: SYSTEM_DEFAULT_MICROPHONE_ID,
  label: "System default",
  groupId: "",
};

const FAILED_MESSAGE =
  "Talk can't reach that microphone. Pick another one below, or allow microphone access.";
const FALLBACK_NOTE = "Your chosen microphone isn't connected.";

/**
 * "Listening on <name>" with the name on its own, ellipsized when a long
 * device name would otherwise wrap or push the rest of the line out.
 */
const ListeningLine: FC<{
  failed: boolean;
  usingFallback: boolean;
  deviceLabel: string;
}> = ({ failed, usingFallback, deviceLabel }) => {
  if (failed) {
    return (
      <Text variant="body1Regular" color="textMuted" style={styles.subtitle}>
        {FAILED_MESSAGE}
      </Text>
    );
  }
  return (
    <View style={styles.subtitle}>
      {usingFallback && (
        <Text variant="body1Regular" color="textMuted" style={styles.line}>
          {FALLBACK_NOTE}
        </Text>
      )}
      <View style={styles.listeningRow}>
        <Text variant="body1Regular" color="textMuted" style={styles.line}>
          Listening on{" "}
        </Text>
        <Text
          variant="body1Regular"
          color="textMuted"
          style={[styles.line, styles.deviceName]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {deviceLabel}
        </Text>
        {usingFallback && (
          <Text variant="body1Regular" color="textMuted" style={styles.line}>
            {" "}
            for now.
          </Text>
        )}
      </View>
    </View>
  );
};

const CARD_STYLE = {
  maxWidth: 574,
  borderRadius: 32,
  paddingVertical: 40,
  paddingHorizontal: 40,
  backgroundColor: DESKTOP_THEME.grey1050,
  borderColor: DESKTOP_THEME.grey950,
};

export const MicTestStep: FC<MicTestStepProps> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const {
    levels,
    failed,
    devices,
    selectedDeviceId,
    deviceLabel,
    usingFallback,
    selectDevice,
  } = useMicMeter(BAR_COUNT);

  // Offered first so the stored "follow my computer" choice is selectable
  // here too, and not only from the dictation settings screen.
  const options = [SYSTEM_DEFAULT_OPTION, ...devices];

  const handleSelectDevice = useCallback(
    (device: AudioDevice) => {
      setDropdownOpen(false);
      selectDevice(device);
    },
    [selectDevice],
  );

  const handleToggleDropdown = useCallback(() => {
    setDropdownOpen((open) => !open);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  useEscapeKey(dropdownOpen, handleCloseDropdown);

  const chevronStyle = dropdownOpen ? styles.chevronUp : undefined;

  return (
    <OnboardingCardLayout onBack={onBack} cardStyle={CARD_STYLE}>
      <Text
        variant="heading2"
        color="textPrimary"
        style={styles.title}
        accessibilityRole="header"
      >
        When speaking, do the bars turn green?
      </Text>
      <ListeningLine
        failed={failed}
        usingFallback={usingFallback}
        deviceLabel={deviceLabel}
      />

      <View style={styles.barsContainer(theme)}>
        {levels.map((level, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor:
                  level > 0 ? DESKTOP_THEME.green600 : DESKTOP_THEME.grey900,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <View style={styles.micSelect}>
          <Pressable
            style={styles.changeMicButton}
            onPress={handleToggleDropdown}
            accessibilityRole="combobox"
            accessibilityLabel="Change microphone"
          >
            <Text variant="body2Regular" color="textMuted">
              Change Microphone
            </Text>
            <View style={chevronStyle}>
              <IconChevronDown
                width={16}
                height={16}
                color={theme.colors.textMuted}
              />
            </View>
          </Pressable>

          {dropdownOpen && (
            <ScrollView style={styles.dropdown(theme)}>
              {options.map((device) => {
                const selected = device.deviceId === selectedDeviceId;
                return (
                  <Pressable
                    key={device.deviceId}
                    onPress={() => handleSelectDevice(device)}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && styles.dropdownItemPressed(theme),
                    ]}
                  >
                    <MicDeviceIcon
                      label={device.label}
                      color={
                        selected
                          ? theme.colors.textPrimary
                          : theme.colors.textMuted
                      }
                    />
                    <Text
                      variant="body2Regular"
                      color={selected ? "textPrimary" : "textSecondary"}
                      style={styles.dropdownLabel}
                      numberOfLines={1}
                    >
                      {device.label}
                    </Text>
                    {selected && (
                      <IconCheck
                        width={16}
                        height={16}
                        color={theme.colors.textPrimary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Button variant="primary" onPress={onNext}>
          Yes, It Does
        </Button>
      </View>
      {dropdownOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={handleCloseDropdown}
          accessibilityRole="button"
          accessibilityLabel="Close microphone list"
        />
      )}
    </OnboardingCardLayout>
  );
};

const styles = createStyles({
  backdrop: {
    position: "absolute",
    top: -4000,
    left: -4000,
    width: 12000,
    height: 12000,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  subtitle: {
    alignSelf: "stretch" as const,
    alignItems: "center" as const,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center" as const,
    marginBottom: 32,
  },
  line: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center" as const,
  },
  listeningRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    maxWidth: "100%" as const,
  },
  deviceName: {
    flexShrink: 1,
    maxWidth: 300,
  },
  barsContainer: (theme) => ({
    width: 494,
    height: 124,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.05),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.05),
    borderRadius: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 5,
    marginBottom: 32,
    alignSelf: "stretch" as const,
  }),
  bar: {
    width: 5,
    height: 40,
    borderRadius: 3,
  },
  buttonRow: {
    alignSelf: "stretch" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
    gap: 8,
    zIndex: 20,
  },
  micSelect: {
    position: "relative" as const,
    zIndex: 20,
  },
  changeMicButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    cursor: "pointer" as never,
  },
  chevronUp: {
    transform: [{ rotate: "180deg" }],
  },
  dropdown: (theme) => ({
    position: "absolute" as const,
    top: "100%" as const,
    left: 0,
    minWidth: 280,
    maxWidth: 360,
    // The card's container clips, so a long input list scrolls instead of
    // running off the bottom.
    maxHeight: 220,
    marginTop: 4,
    backgroundColor: DESKTOP_THEME.grey950,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.1),
    paddingVertical: 4,
    zIndex: 20,
    overflow: "hidden" as const,
  }),
  dropdownItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    cursor: "pointer" as never,
  },
  dropdownItemPressed: (theme) => ({
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.08),
  }),
  dropdownLabel: {
    flex: 1,
  },
});
