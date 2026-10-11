import { Text } from "@/components/Typography";
import type { TextProps } from "@/components/Typography";
import { TextInput } from "@/components/Input";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import type { Role } from "../../OnboardingContext";
import { useOnboarding } from "../../OnboardingContext";

interface RoleField {
  value: Role;
  label: string;
}

const ROLE_OPTIONS: RoleField[] = [
  { value: "sales", label: "Sales" },
  { value: "product_design", label: "Product / Design" },
  { value: "engineering", label: "Engineering" },
  { value: "marketing", label: "Marketing" },
  { value: "recruiting_hr", label: "Recruiting / HR" },
  { value: "cxo_founder", label: "CXO / Founder" },
  { value: "customer_success_support", label: "Customer Success / Support" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "student", label: "Student" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
];

interface PillProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const Pill: FC<PillProps> = ({ label, isSelected, onPress }) => {
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
      <Text variant="body2Regular" color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
};

export const RoleSelection: FC = () => {
  const {
    selectedRole,
    setSelectedRole,
    customRole,
    setCustomRole,
    setSelectedTitle,
  } = useOnboarding();
  const [inputFocused, setInputFocused] = useState(false);

  const showInput = selectedRole === "other";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.pillGrid,
          {
            marginBottom: showInput ? 50 : 100,
          },
        ]}
      >
        {ROLE_OPTIONS.map((role) => (
          <Pill
            key={role.value}
            label={role.label}
            isSelected={selectedRole === role.value}
            onPress={() => {
              setSelectedRole(role.value);
              setSelectedTitle(null);
              if (role.value !== "other") setCustomRole("");
            }}
          />
        ))}
      </View>

      {showInput && (
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="E.g. Data & Analytics"
            value={customRole}
            onValueChange={setCustomRole}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={[styles.textInput, inputFocused && styles.textInputFocused]}
            variant="outlined"
          />
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  container: {
    alignItems: "center",
    width: "100%",
    gap: 48,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    maxWidth: 764,
  },
  pill: {
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
