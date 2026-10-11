import {
  IconActivity,
  IconDottedCircle,
  IconDownload,
  IconHash,
  IconHelpCircle,
  IconLogOut,
  IconMediaLibrary,
  IconSend,
  IconSettings,
  IconStar,
  IconUpload,
  IconZap,
} from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import type { Href } from "@/components/Link";
import { LinkView } from "@/components/Link";
import { NumberBadge } from "@/components/NumberBadge";
import { Separator } from "@/components/Separator";
import { Tag } from "@/components/Tag";
import { Text } from "@/components/Typography";
import {
  Config,
  HELP_CENTER_URL,
  RouteNames,
  SHARE_FEEDBACK_URL,
} from "@/constants";
import type { AuthUser } from "@/features/auth";
import { authApi, useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import { LocalRecordingsDialog } from "@/features/live-record";
import { useBooleanState } from "@/utils/states";
import { DownloadStatus, useDownloads } from "@/features/downloads";
import * as NativeCode from "@/modules/native-code";
import { createStyles, useTheme } from "@/styles";
import { getPlanName } from "@firefliesai/payments-ff.utils";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC, ReactNode } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";
import type { ParamList } from "../types";
import { CreditStorageBanner } from "./components/CreditStorageBanner";
import { MobileRecordBanner } from "./components/MobileRecordBanner";
import { vars } from "@/styles/";
import { getAppVersion } from "@/utils/version";

const YouBanner: FC<{ user: AuthUser }> = ({ user }) => {
  const { hidePaidFeatures } = usePaywallConfig();

  return (
    <>
      <View style={styles.user}>
        <Avatar
          name={user.name}
          picture={user.photoUrl}
          size={48}
          shape="square"
        />
        <View style={styles.userInfo}>
          <Text variant="title2Weight" color="textPrimary">
            {user.name}
          </Text>
          <Text variant="body2Regular" color="textMuted">
            {user.email}
          </Text>
        </View>
        {!hidePaidFeatures && (
          <Tag>{getPlanName(user.paidUser).toUpperCase()}</Tag>
        )}
      </View>
    </>
  );
};

const MenuItem: FC<{
  Icon?: FC<SvgProps>;
  label: string;
  isNew?: boolean;
  badge?: ReactNode;
  onPress?: () => void;
  href?: Href;
  externalUrl?: string;
}> = ({ Icon, label, isNew, badge, href, externalUrl, onPress }) => {
  const theme = useTheme();

  const { hidePaidFeatures } = usePaywallConfig();

  const node = (
    <View style={styles.menuItem}>
      {Icon && (
        <Icon
          color={theme.colors.textSecondary}
          width={20}
          height={20}
          strokeWidth={1.5}
        />
      )}
      <Text color="textSecondary">{label}</Text>
      {badge}
      {isNew && (
        <View style={styles.menuItemNew(theme)}>
          <Text
            color={
              theme.name === "dark" ? "textBrand" : "commandContrastDefault"
            }
          >
            New
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} aria-label={label}>
        {node}
      </Pressable>
    );
  }

  if (!href && externalUrl) {
    return (
      <Pressable onPress={() => NativeCode.openInBrowser(externalUrl)}>
        {node}
      </Pressable>
    );
  }

  if (hidePaidFeatures && externalUrl) {
    return (
      <Pressable onPress={() => NativeCode.openInBrowser(externalUrl)}>
        {node}
      </Pressable>
    );
  }

  return (
    <LinkView href={href as string} animated>
      {node}
    </LinkView>
  );
};

export const YouScreen: FC<NativeStackScreenProps<ParamList, "You">> = () => {
  const appVersion = getAppVersion();

  const [isOpenRecordings, openRecordings, closeRecordings] = useBooleanState();
  const { user: currentUser } = useAuth();
  const downloadedCount = useDownloads(
    (s) =>
      s.index.filter(
        (e) => e.isManual && e.status.state === DownloadStatus.COMPLETE,
      ).length,
  );
  if (!currentUser) return null;

  return (
    <>
      <ScrollView style={styles.root}>
        <SafeAreaView style={styles.content} edges={["bottom"]}>
          <YouBanner user={currentUser} />
          <CreditStorageBanner />
          <MobileRecordBanner />
          <View style={styles.menu}>
            <MenuItem
              Icon={IconZap}
              label="Meeting Status"
              href={RouteNames.MeetingStatus}
            />
            <MenuItem
              Icon={IconUpload}
              label="Uploads"
              href={RouteNames.Upload}
            />
            {Platform.OS !== "web" && (
              <MenuItem
                Icon={IconDownload}
                label="Downloads"
                href={RouteNames.Downloads}
                badge={
                  downloadedCount > 0 ? (
                    <NumberBadge color="blue">{downloadedCount}</NumberBadge>
                  ) : undefined
                }
              />
            )}
            <MenuItem
              Icon={IconMediaLibrary}
              label="Library"
              href={RouteNames.Library}
            />
            <MenuItem
              Icon={IconDottedCircle}
              label="Local Recordings"
              onPress={openRecordings}
            />
            <Separator />
            <MenuItem
              Icon={IconHash}
              label="Topic Tracker"
              href={RouteNames.TopicTracker}
              externalUrl={`${Config.DASHBOARD_URL}/topics`}
            />
            <Separator />
            <MenuItem
              Icon={IconSettings}
              label="Settings"
              href={RouteNames.Settings}
            />
            <Separator />
            {Platform.OS !== "ios" && (
              <MenuItem
                Icon={(props) => <IconSend {...props} fill="none" />}
                label="Refer & earn credits"
                href={RouteNames.Refer}
                isNew
              />
            )}
            <MenuItem
              Icon={IconStar}
              label="Share feedback"
              externalUrl={SHARE_FEEDBACK_URL}
            />
            <MenuItem
              Icon={IconHelpCircle}
              label="Help center"
              externalUrl={HELP_CENTER_URL}
            />
            <MenuItem
              Icon={IconActivity}
              label="Diagnostic"
              href={RouteNames.Diagnostic}
            />
            <Separator />
            <MenuItem
              Icon={IconLogOut}
              label="Log out"
              onPress={() => {
                authApi.logout("User action");
              }}
            />
          </View>
          <View style={styles.versionRow}>
            <Text variant="body3Regular" color="textMuted">
              v{appVersion}
            </Text>
            {Config.APP_ENV !== "production" && (
              <Tag style={styles.envTag}>{Config.APP_ENV}</Tag>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
      <LocalRecordingsDialog
        isOpen={isOpenRecordings}
        close={closeRecordings}
      />
    </>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 16,
  },
  userInfo: {
    flex: 1,
  },
  userTierText: {
    textTransform: "capitalize",
  },
  menu: {
    flexDirection: "column",
    gap: 12,
    paddingBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderRadius: 8,
    flex: 1,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  envTag: {
    borderRadius: 16,
    backgroundColor: vars.colors.blue100,
  },
  menuItemNew: (theme) => ({
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.layerBrandLight2
        : theme.colors.layerBrand,
    marginLeft: 4,
  }),
});
