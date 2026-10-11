import { Text } from "@/components/Typography";
import type { TextProps } from "@/components/Typography";
import { TextInput } from "@/components/Input";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import type { Role } from "../../OnboardingContext";
import type { ToolKey } from "../constants";
import { DEFAULT_TOOLS, ROLE_TOOLS, TOOL_DEFINITIONS } from "../constants";
import { useOnboarding } from "../../OnboardingContext";

interface AppOption {
  value: ToolKey;
  label: string;
  icon?: FC<{ width: number; height: number; color?: string }>;
}

function getToolOptionsForRole(role: Role | null): AppOption[] {
  const toolKeys = role ? ROLE_TOOLS[role] : DEFAULT_TOOLS;
  const options: AppOption[] = toolKeys.map((key) => {
    const def = TOOL_DEFINITIONS[key];
    return { value: key, label: def.name, icon: def.icon };
  });
  options.push({ value: "other", label: "Other" });
  return options;
}

interface AppPillProps {
  app: AppOption;
  isSelected: boolean;
  onPress: () => void;
}

const AppPill: FC<AppPillProps> = ({ app, isSelected, onPress }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  const onPointerEnter = useCallback(() => setHovered(true), []);
  const onPointerLeave = useCallback(() => setHovered(false), []);

  let textColor: TextProps["color"] = "textMuted";
  if (isSelected) textColor = "rainbowInteractivePurpleDisabled";
  else if (hovered) textColor = "textSecondary";

  return (
    <Pressable
      onPress={onPress}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={[
        styles.pill,
        isSelected
          ? styles.pillSelected(theme)
          : hovered
            ? styles.pillHovered
            : styles.pillDefault,
      ]}
    >
      {app.icon && <app.icon width={20} height={20} />}
      <Text variant="body2Regular" color={textColor}>
        {app.label}
      </Text>
    </Pressable>
  );
};

export const IntegrationPreference: FC = () => {
  const {
    selectedRole,
    selectedApps,
    setSelectedApps,
    customApp,
    setCustomApp,
  } = useOnboarding();
  const [inputFocused, setInputFocused] = useState(false);

  const toolOptions = useMemo(
    () => getToolOptionsForRole(selectedRole),
    [selectedRole],
  );

  const toggleApp = useCallback(
    (value: string) => {
      setSelectedApps(
        selectedApps.includes(value)
          ? selectedApps.filter((a) => a !== value)
          : [...selectedApps, value],
      );
    },
    [selectedApps, setSelectedApps],
  );

  const showInput = selectedApps.includes("other");

  return (
    <View style={styles.container}>
      <View style={styles.selectionArea}>
        <View style={styles.pillGrid}>
          {toolOptions.map((app) => (
            <AppPill
              key={app.value}
              app={app}
              isSelected={selectedApps.includes(app.value)}
              onPress={() => toggleApp(app.value)}
            />
          ))}
        </View>

        {/* Fixed-height slot so adding the input doesn't shift the continue button or content above */}
        <View style={styles.inputSlot}>
          {showInput && (
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="E.g. Data & Analytics"
                value={customApp}
                onValueChange={setCustomApp}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={[
                  styles.textInput,
                  inputFocused && styles.textInputFocused,
                ]}
                variant="outlined"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  selectionArea: {
    alignItems: "center",
    gap: 40,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    maxWidth: 560,
    marginBottom: 24,
  },
  inputSlot: {
    minHeight: 56,
    width: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  pillDefault: {
    backgroundColor: DESKTOP_THEME.grey1000,
    borderColor: DESKTOP_THEME.grey900,
  },
  pillHovered: {
    backgroundColor: DESKTOP_THEME.grey800,
    borderColor: DESKTOP_THEME.grey400,
  },
  pillSelected: (theme) => ({
    backgroundColor: DESKTOP_THEME.purple1100,
    borderColor: theme.colors.rainbowInteractivePurpleDefault,
  }),
  inputWrapper: {
    width: 280,
    alignItems: "center",
  },
  textInput: {
    width: "100%",
    backgroundColor: DESKTOP_THEME.grey900,
    borderColor: DESKTOP_THEME.grey800,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  textInputFocused: {
    borderColor: DESKTOP_THEME.grey500,
    backgroundColor: DESKTOP_THEME.grey900,
  },
});
