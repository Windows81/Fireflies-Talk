import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import {
  SettingField,
  SettingLabel,
  SettingRow,
} from "../components/SettingsForm";
import { usePrivacyConsentState } from "./usePrivacyConsentState";

const Notice: FC<{ message: string }> = ({ message }) => {
  return (
    <View style={styles.notice}>
      <Text variant="body2Regular" color="textMuted">
        {message}
      </Text>
    </View>
  );
};

export const PrivacyConsentSettings: FC = () => {
  const {
    consentState,
    isGlobalPrivacyControl,
    optOutAnalytics,
    togglesDisabled,
    updateCategory,
  } = usePrivacyConsentState();

  return (
    <View style={styles.root}>
      {isGlobalPrivacyControl && (
        <Notice message="Global Privacy Control detected. Non-essential storage has been disabled to respect your browser privacy settings." />
      )}
      {optOutAnalytics && !isGlobalPrivacyControl && (
        <Notice message="Analytics collection has been disabled by your organization." />
      )}

      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Essential"
            description="Required for the app to function. These cannot be disabled."
            id="setting-label-essential-cookies"
          />
          <Switch
            value={true}
            onValueChange={() => {}}
            disabled={true}
            aria-labelledby="setting-label-essential-cookies"
          />
        </SettingRow>
      </SettingField>

      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Analytics"
            description="Help us understand how you use the app so we can improve it."
            id="setting-label-analytics-cookies"
          />
          <Switch
            value={consentState.analytics_storage === "granted"}
            onValueChange={(value) =>
              updateCategory("analytics_storage", value)
            }
            disabled={togglesDisabled}
            aria-labelledby="setting-label-analytics-cookies"
          />
        </SettingRow>
      </SettingField>

      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Advertising"
            description="Used for personalized ads and marketing measurement."
            id="setting-label-advertising-cookies"
          />
          <Switch
            value={consentState.ad_storage === "granted"}
            onValueChange={(value) =>
              updateCategory(
                ["ad_storage", "ad_user_data", "ad_personalization"],
                value,
              )
            }
            disabled={togglesDisabled}
            aria-labelledby="setting-label-advertising-cookies"
          />
        </SettingRow>
      </SettingField>

      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Personalization"
            description="Used to personalize your experience across Fireflies."
            id="setting-label-personalization-cookies"
          />
          <Switch
            value={consentState.personalization_storage === "granted"}
            onValueChange={(value) =>
              updateCategory("personalization_storage", value)
            }
            disabled={togglesDisabled}
            aria-labelledby="setting-label-personalization-cookies"
          />
        </SettingRow>
      </SettingField>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    gap: 36,
  },
  notice: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
});
