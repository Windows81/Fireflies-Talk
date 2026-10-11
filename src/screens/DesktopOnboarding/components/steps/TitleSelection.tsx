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
  value: string;
  label: string;
}

const TITLE_OPTIONS: Record<
  Exclude<Role, "freelancer" | "student" | "other" | "cxo_founder">,
  RoleField[]
> = {
  sales: [
    { value: "sales_representative", label: "Sales Representative" },
    { value: "account_executive", label: "Account Executive" },
    { value: "sales_manager", label: "Sales Manager" },
    { value: "sales_operations_manager", label: "Sales Operations Manager" },
    { value: "head_of_sales", label: "Head of Sales" },
  ],
  product_design: [
    { value: "pm", label: "PM" },
    { value: "user_research", label: "User Research" },
    { value: "product_designer", label: "Product Designer" },
    { value: "vp_director_product", label: "VP/Director of Product" },
    { value: "chief_product_officer", label: "Chief Product Officer" },
  ],
  marketing: [
    { value: "marketing_manager", label: "Marketing Manager" },
    { value: "content_marketing_manager", label: "Content Marketing Manager" },
    {
      value: "performance_marketing_specialist",
      label: "Performance Marketing Specialist",
    },
    { value: "social_media_manager", label: "Social Media Manager" },
    { value: "head_of_marketing_cmo", label: "Head of Marketing / CMO" },
  ],
  recruiting_hr: [
    {
      value: "talent_acquisition_specialist",
      label: "Talent Acquisition Specialist",
    },
    { value: "hr_manager", label: "HR Manager" },
    {
      value: "people_operations_manager",
      label: "People Operations Manager",
    },
    { value: "ld_specialist", label: "L&D Specialist" },
    { value: "chro", label: "CHRO" },
  ],
  customer_success_support: [
    {
      value: "customer_success_manager",
      label: "Customer Success Manager",
    },
    { value: "customer_support_rep", label: "Customer Support Rep" },
    {
      value: "technical_support_engineer",
      label: "Technical Support Engineer",
    },
    {
      value: "head_of_customer_success",
      label: "Head of Customer Success",
    },
    {
      value: "head_of_customer_support",
      label: "Head of Customer Support",
    },
  ],
  finance: [
    { value: "financial_analyst", label: "Financial Analyst" },
    {
      value: "portfolio_wealth_manager",
      label: "Portfolio / Wealth Manager",
    },
    { value: "head_of_finance_cfo", label: "Head of Finance / CFO" },
    { value: "risk_manager", label: "Risk Manager" },
    { value: "investment_banker", label: "Investment Banker" },
  ],
  engineering: [
    {
      value: "software_engineer",
      label: "Software Engineer / Software Developer",
    },
    { value: "engineering_manager", label: "Engineering Manager" },
    { value: "technical_lead", label: "Technical Lead" },
    {
      value: "head_of_engineering_cto",
      label: "Head of Engineering / CTO",
    },
  ],
  healthcare: [
    {
      value: "physicians_and_surgeons",
      label: "Physicians & Surgeons",
    },
    { value: "nursing_professionals", label: "Nursing Professionals" },
    {
      value: "therapists_and_diagnostic_staff",
      label: "Therapists & Diagnostic Staff",
    },
    { value: "pharmacists", label: "Pharmacists" },
    {
      value: "administrative_and_support_staff",
      label: "Administrative & Support Staff",
    },
  ],
};

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

export const TitleSelection: FC = () => {
  const {
    selectedRole,
    selectedTitle,
    setSelectedTitle,
    customTitle,
    setCustomTitle,
  } = useOnboarding();
  const [inputFocused, setInputFocused] = useState(false);

  const titles =
    TITLE_OPTIONS[selectedRole as keyof typeof TITLE_OPTIONS] ?? [];

  const showInput = selectedTitle === "other";

  return (
    <View style={styles.container}>
      <View style={styles.selectionArea}>
        <View style={styles.pillGrid}>
          {titles.map((title) => (
            <Pill
              key={title.value}
              label={title.label}
              isSelected={selectedTitle === title.value}
              onPress={() => {
                setSelectedTitle(title.value);
                if (title.value !== "other") setCustomTitle("");
              }}
            />
          ))}
          <Pill
            label="Other"
            isSelected={selectedTitle === "other"}
            onPress={() => setSelectedTitle("other")}
          />
        </View>

        <View style={styles.inputSlot}>
          {showInput && (
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="E.g. Data & Analytics"
                value={customTitle}
                onValueChange={setCustomTitle}
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
    flex: 0.9,
    width: "100%",
  },
  selectionArea: {
    alignItems: "center",
    gap: 16,
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
  inputSlot: {
    height: 56,
    width: 280,
    marginTop: 95,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    width: "100%",
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
