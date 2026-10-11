import { Select } from "@/components/Input";
import { useSaveOptions } from "@/features/settings";
import type { User } from "@/graphql";
import type { FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";

const INDUSTRY_OPTIONS = [
  {
    label: "Sales",
    value: "sales",
  },
  {
    label: "Recruiting",
    value: "recruiting",
  },
  {
    label: "Consulting",
    value: "consulting",
  },
  {
    label: "Venture Capital",
    value: "venture-capital",
  },
  {
    label: "User Interviews",
    value: "interviews",
  },
  {
    label: "Management",
    value: "management",
  },
  {
    label: "Customer Success",
    value: "customersuccess",
  },
  {
    label: "Product/Engineering",
    value: "product",
  },
  {
    label: "Operations",
    value: "operations",
  },
  {
    label: "Reporter",
    value: "reporter",
  },
  {
    label: "Media",
    value: "media",
  },
  {
    label: "Education",
    value: "education",
  },
  {
    label: "Healthcare",
    value: "healthcare",
  },
  {
    label: "Other",
    value: "other",
  },
];

export const AiCustomizationIndustry: FC<{
  user: User;
}> = ({ user }) => {
  const industry = user.industry || "other";

  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    errorMessage: "Could not save industry option",
    successMessage: "Industry settings saved successfully",
    user,
  });

  const updateIndustry = (newIndustry: string) => {
    updateOptions({
      variables: {
        industry: newIndustry,
      },
    });
  };

  return (
    <SettingsGroup title="Industry Settings">
      <SettingField>
        <SettingLabel
          title="Select your most common type of meeting"
          description="Fireflies will optimize the speech model for your industry"
        />
      </SettingField>
      <Select
        value={industry}
        onValueChange={updateIndustry}
        options={INDUSTRY_OPTIONS}
        disabled={loadingUpdateOptions}
      />
    </SettingsGroup>
  );
};
