import { IconArrowUpRight, IconLogOut, IconSettings } from "@/assets/svg";
import { MenuPopover, MenuItem } from "@/components/Menu";
import { Text } from "@/components/Typography";
import { Config, RouteNames } from "@/constants";
import { DASHBOARD_NOTEBOOK_URL } from "@/constants/links";
import { useAuth } from "@/features/auth";
import { useBilling } from "@/features/billing";
import { createStyles, useTheme } from "@/styles";
import { getPlanName } from "@firefliesai/payments-ff.utils";
import type { FC } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { RootNavigation } from "../RootNavigation";
import type { DesktopSettingsContent } from "../types";
import { CreditsProgressBar } from "./CreditsProgressBar";
import {
  calculateStorageMetrics,
  getStorageSubtext,
  getStoragePercentage,
  getMeetingsCreditsSubtext,
  getMeetingCreditsPercentage,
  getAICreditsSubtext,
  getAICreditsPercentage,
  shouldShowGetAICreditsButton,
  getUserName,
} from "./profileMenuHelpers";
import { openURL } from "@/features/navigation";
import { UpgradeButton } from "./components";

interface ProfileMenuProps {
  isOpen: boolean;
  close: () => void;
  triggerRef: React.RefObject<View | null>;
  settingsContent?: DesktopSettingsContent;
}

export const ProfileMenu: FC<ProfileMenuProps> = ({
  isOpen,
  close,
  triggerRef,
  settingsContent,
}) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const {
    teamMinutesConsumed,
    isFreeUser,
    freeMeetingsLeft,
    freeMeetingsLimit,
    monthlyAICreditsUsed,
    monthlyAICreditsLimit,
  } = useBilling();

  const planName = getPlanName(user?.paidUser ?? undefined);
  const storagePlanType = isFreeUser ? "Storage" : planName;

  const handleAllMeetingsClick = () => {
    openURL(DASHBOARD_NOTEBOOK_URL);
    close();
  };

  const handleSettingsClick = () => {
    RootNavigation.navigate(
      RouteNames.DesktopSettings,
      settingsContent ? { activeContent: settingsContent } : undefined,
    );
    close();
  };

  const handleLogout = () => {
    logout("user-initiated");
    close();
  };

  const handleUpgradeClick = () => {
    openURL(`${Config.DASHBOARD_URL}/upgrade?pwl=desktop_profile_menu`);
    close();
  };

  const storageMetrics = useMemo(
    () =>
      calculateStorageMetrics({
        _minutesConsumed: teamMinutesConsumed?.minutesConsumed,
        isInfinity: teamMinutesConsumed?.isInfinity,
        tierLimit: teamMinutesConsumed?.tierLimit,
      }),
    [teamMinutesConsumed],
  );

  const creditsMetrics = useMemo(() => {
    const { tierLimit, subtraction, above, isAbove } = storageMetrics;

    return {
      storageSubtext: getStorageSubtext(isAbove, above, subtraction, tierLimit),
      aiCreditsSubtext: getAICreditsSubtext(
        monthlyAICreditsLimit,
        monthlyAICreditsUsed,
      ),
      storagePercentage: getStoragePercentage(subtraction, tierLimit),
      aiCreditsPercentage: getAICreditsPercentage(
        monthlyAICreditsLimit,
        monthlyAICreditsUsed,
      ),
      shouldShowGetAICreditsButton: shouldShowGetAICreditsButton(
        !isFreeUser,
        monthlyAICreditsLimit,
        monthlyAICreditsUsed,
      ),
      meetingsCreditsSubtext: getMeetingsCreditsSubtext(
        freeMeetingsLeft || 0,
        freeMeetingsLimit,
      ),
      meetingsCreditsPercentage: getMeetingCreditsPercentage(
        freeMeetingsLeft || 0,
        freeMeetingsLimit,
      ),
    };
  }, [
    storageMetrics,
    monthlyAICreditsLimit,
    monthlyAICreditsUsed,
    isFreeUser,
    freeMeetingsLeft,
    freeMeetingsLimit,
  ]);

  if (!user) return null;

  return (
    <MenuPopover
      style={styles.menu(theme)}
      isOpen={isOpen}
      close={close}
      triggerRef={triggerRef}
      width={260}
    >
      {/* User Info Section */}
      <MenuItem disabled style={styles.userInfoItem(theme)}>
        <View style={styles.userInfo}>
          <Text variant="body1Weight" color="textPrimary">
            Hi {getUserName(user)}
          </Text>
          <Text variant="body3Regular" color="textMuted">
            {user.email}
          </Text>
        </View>
      </MenuItem>

      {/* Free User: Meetings Credits */}
      {isFreeUser && (
        <MenuItem disabled style={styles.creditsItem(theme)}>
          <View style={styles.creditsContent}>
            <CreditsProgressBar
              isFreeUser={isFreeUser}
              planType={planName}
              subText={creditsMetrics.meetingsCreditsSubtext}
              percentage={creditsMetrics.meetingsCreditsPercentage}
            />
            <UpgradeButton
              percentage={creditsMetrics.meetingsCreditsPercentage}
              onPress={handleUpgradeClick}
              source="desktop_profile_menu_free_user"
            />
          </View>
        </MenuItem>
      )}

      {/* Storage Progress */}
      {storageMetrics.tierLimit > 0 && !storageMetrics.isInfinity && (
        <MenuItem disabled style={styles.creditsItem(theme)}>
          <View style={styles.creditsContent}>
            <CreditsProgressBar
              isFreeUser={isFreeUser}
              planType={storagePlanType}
              subText={creditsMetrics.storageSubtext}
              percentage={creditsMetrics.storagePercentage}
            />
            {!isFreeUser && creditsMetrics.storagePercentage <= 10 && (
              <UpgradeButton
                percentage={creditsMetrics.storagePercentage}
                onPress={handleUpgradeClick}
                source="desktop_profile_menu_low_storage"
              />
            )}
          </View>
        </MenuItem>
      )}

      {/* Infinity Storage */}
      {storageMetrics.isInfinity && (
        <MenuItem disabled style={styles.creditsItem(theme)}>
          <CreditsProgressBar
            planType={planName}
            subText="Unlimited meetings"
          />
        </MenuItem>
      )}

      {/* AI Credits */}
      {creditsMetrics.shouldShowGetAICreditsButton && (
        <MenuItem disabled style={styles.creditsItem(theme)}>
          <CreditsProgressBar
            planType="AI Credits"
            subText={creditsMetrics.aiCreditsSubtext}
            percentage={creditsMetrics.aiCreditsPercentage}
          />
        </MenuItem>
      )}

      {/* All Meetings */}
      <MenuItem onPress={handleAllMeetingsClick}>
        <View style={styles.menuItemContainer}>
          <Text variant="body2Regular" color="textPrimary">
            All meetings
          </Text>
          <IconArrowUpRight
            width={16}
            height={16}
            color={theme.colors.textPrimary}
          />
        </View>
      </MenuItem>

      <MenuItem onPress={handleSettingsClick}>
        <View style={styles.menuItemContainer}>
          <Text variant="body2Regular" color="textPrimary">
            Settings
          </Text>
          <IconSettings
            width={16}
            height={16}
            color={theme.colors.textPrimary}
          />
        </View>
      </MenuItem>

      {/* Divider */}
      <View style={styles.divider(theme)} />

      {/* Logout */}
      <MenuItem onPress={handleLogout}>
        <View style={styles.menuItemContainer}>
          <Text variant="body2Regular" color="textPrimary">
            Logout
          </Text>
          <IconLogOut width={16} height={16} color={theme.colors.textPrimary} />
        </View>
      </MenuItem>
    </MenuPopover>
  );
};

const styles = createStyles({
  menu: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Disabled,
  }),
  userInfoItem: (theme) => ({
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStaticDefault,
    paddingBottom: 8,
    borderRadius: 0,
  }),
  userInfo: {
    width: "100%",
    gap: 4,
  },
  creditsItem: (theme) => ({
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStaticSubtle,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 0,
    marginHorizontal: 0,
  }),
  creditsContent: {
    width: "100%",
    flexDirection: "column",
    gap: 0,
  },
  menuItemContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: (theme) => ({
    height: 1,
    width: "100%",
    marginVertical: 4,
    backgroundColor: theme.colors.borderStaticSubtle,
  }),
});
