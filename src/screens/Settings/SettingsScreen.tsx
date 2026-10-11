import { Text } from "@/components/Typography";
import { useGetCurrentUserQuery } from "@/graphql";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC, PropsWithChildren } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import type { ParamList } from "../types";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { AiCustomizationIndustry } from "./ai-customization/AiCustomizationIndustry";
import { SettingsUpdateOnWeb } from "./components/SettingsUpdateOnWeb";
import { DownloadsSettings } from "./downloads/DownloadsSettings";
import { MeetingComplianceParticipantNotification } from "./meeting-compliance/MeetingComplianceParticipantNotification";
import { MeetingSettingsAutoJoin } from "./meeting-settings/MeetingSettingsAutoJoin";
import { MeetingSettingsLanguage } from "./meeting-settings/MeetingSettingsLanguage";
import { MeetingSettingsRecordLanguage } from "./meeting-settings/MeetingSettingsRecordLanguage";
import { MeetingSettingsPrivacy } from "./meeting-settings/MeetingSettingsPrivacy";
import { MeetingSettingsRecap } from "./meeting-settings/MeetingSettingsRecap";
import { MeetingSettingsRules } from "./meeting-settings/MeetingSettingsRules";
import { MeetingSettingsRecordVideo } from "./meeting-settings/MeetingSettingsRecordVideo";
import { PrivacyConsentSettings } from "./privacy-consent/PrivacyConsentSettings";
import { Config } from "@/constants";
import { useTeam } from "@/features/team";
import { isDesktop } from "@/utils/device";

const SettingSection: FC<
  PropsWithChildren<{
    title: string;
  }>
> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      <Text variant="heading5Weight" color="textBrand">
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export const SettingsScreen: FC<
  NativeStackScreenProps<ParamList, "Settings">
> = () => {
  const { data: dataUser } = useGetCurrentUserQuery();
  const { isAdmin } = useTeam();

  const user = dataUser?.user;

  if (!user) {
    return null;
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Desktop always renders its own dark theme */}
        {!isDesktop && (
          <SettingSection title="Appearance">
            <AppearanceSettings />
          </SettingSection>
        )}
        <SettingSection title="Meeting Settings">
          <MeetingSettingsLanguage user={user} />
          <MeetingSettingsRecordLanguage user={user} />
          <MeetingSettingsAutoJoin user={user} />
          <MeetingSettingsRecap user={user} />
          <MeetingSettingsPrivacy user={user} />
          <MeetingSettingsRecordVideo user={user} />
          <MeetingSettingsRules user={user} />
        </SettingSection>
        <SettingSection title="Meeting Compliance">
          <MeetingComplianceParticipantNotification user={user} />
        </SettingSection>
        <SettingSection title="AI Customization">
          <AiCustomizationIndustry user={user} />
        </SettingSection>
        {/* Downloads are iOS/Android only; "web" here also covers desktop */}
        {Platform.OS !== "web" && (
          <SettingSection title="Downloads">
            <DownloadsSettings />
          </SettingSection>
        )}
        <SettingSection title="Cookies & Privacy">
          <PrivacyConsentSettings />
        </SettingSection>
        <SettingSection title="Account Settings">
          <SettingsUpdateOnWeb
            label="account settings"
            url={`${Config.DASHBOARD_URL}/settings`}
          />
        </SettingSection>
        {isAdmin && (
          <SettingSection title="Team Settings">
            <SettingsUpdateOnWeb
              label="team settings"
              url={`${Config.DASHBOARD_URL}/team/settings`}
            />
          </SettingSection>
        )}
        {/* <SettingSection title="Phone Number">
          <PhoneCallSettings />
        </SettingSection> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 64,
    gap: 64,
  },
  section: {
    flexDirection: "column",
    gap: 24,
  },
  sectionContent: {
    flexDirection: "column",
    gap: 36,
  },
});
