import { IconGoogleGColor, IconLock, IconMicrosoftColor } from "@/assets/svg";
import { LoadingSpinner } from "@/components/Loading";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { CanceledError, captureException } from "@/errors";
import { createStyles, useTheme, vars } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { Fragment, useState, type ReactNode } from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { CalendarAccessExplainDialog } from "../../components/CalendarAccessExplainDialog";
import { authApi } from "../../store";
import { ManualLoginInput } from "../ManualLoginInput";
import { BottomBorderGlow } from "./BottomBorderGlow";
import { DesktopLoginHeader } from "./DesktopLoginHeader";
import { DesktopLoginPrivacyPolicy } from "./DesktopLoginPrivacyPolicy";
import { DesktopSsoLoginForm } from "./DesktopSsoLoginForm";
import { SsoLoginButton } from "./SsoLoginButton";

const LoginButton: FC<{
  icon: ReactNode;
  text: string;
  onPress: () => void;
}> = ({ icon, text, onPress }) => {
  return (
    <Pressable style={styles.loginButton} onPress={onPress} tabIndex={-1}>
      {icon}
      <Text
        variant="label2Weight"
        color="commandNeutralDefault"
        maxFontSizeMultiplier={1.25}
      >
        {text}
      </Text>
    </Pressable>
  );
};

const SECURITY_BADGES = [
  "SOC 2 TYPE II",
  "GDPR",
  "HIPAA",
  "256-BIT ENCRYPTION",
] as const;

const SecurityBadges: FC<{ color: string }> = ({ color }) => (
  <>
    <IconLock width={16} height={16} color={color} />
    {SECURITY_BADGES.map((badge, index) => (
      <Fragment key={badge}>
        {index > 0 && (
          <View
            style={[styles.securityBadgeSeparator, { backgroundColor: color }]}
          />
        )}
        <Text variant="body3Regular" color="rainbowStaticTealSubtle">
          {badge}
        </Text>
      </Fragment>
    ))}
  </>
);

export const DesktopLoginView: FC<{
  onLogin: () => void;
}> = ({ onLogin }) => {
  const [
    isCalendarAccessExplainOpen,
    openCalendarAccessExplain,
    closeCalendarAccessExplain,
  ] = useBooleanState();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSsoForm, setShowSsoForm] = useState(false);

  const doLogin = (type: "google" | "outlook") => {
    if (loading) return;
    setLoading(true);
    authApi
      .authorize(type)
      .then(onLogin)
      .catch((error) => {
        if (error instanceof CanceledError) return;
        captureException(error, {
          tags: {
            section: "login",
          },
        });
        toast({
          message: error.message,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <ScrollView
        nativeID="drag-region"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <DesktopLoginHeader />
          <DesktopLoginPrivacyPolicy />
          <View nativeID="no-drag" style={styles.card}>
            {loading ? (
              <View style={styles.loading}>
                <LoadingSpinner />
              </View>
            ) : showSsoForm ? (
              <DesktopSsoLoginForm onBack={() => setShowSsoForm(false)} />
            ) : (
              <>
                <View style={styles.buttons}>
                  <LoginButton
                    icon={<IconGoogleGColor width={20} height={20} />}
                    text="Continue With Google"
                    onPress={() => doLogin("google")}
                  />
                  <LoginButton
                    icon={<IconMicrosoftColor width={20} height={20} />}
                    text="Continue With Microsoft"
                    onPress={() => doLogin("outlook")}
                  />
                  {Config.APP_ENV !== "production" && (
                    <ManualLoginInput
                      onLogin={onLogin}
                      placeholder="Enter access token to manual login"
                    />
                  )}
                </View>
                <SsoLoginButton onPress={() => setShowSsoForm(true)} />
              </>
            )}
            {!showSsoForm && (
              <TouchableOpacity
                onPress={openCalendarAccessExplain}
                style={styles.calendarNotice}
              >
                <Text
                  variant="body3Regular"
                  color="textHint"
                  style={styles.calendarNoticeText}
                >
                  Why does Fireflies require access to my calendar?
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomGlowContainer} pointerEvents="none">
          <BottomBorderGlow />
        </View>
      </ScrollView>
      <View nativeID="drag-region" style={styles.securityNotice}>
        <SecurityBadges color={theme.colors.rainbowStaticTealSubtle} />
      </View>
      <CalendarAccessExplainDialog
        isOpen={isCalendarAccessExplainOpen}
        close={closeCalendarAccessExplain}
      />
    </>
  );
};

const styles = createStyles({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    zIndex: 2,
  },
  container: {
    display: "flex",
    overflow: "visible",
    paddingVertical: 32,
    maxWidth: 880,
    minWidth: 400,
    width: "100%",
    justifyContent: "center",
    borderRadius: 20,
    borderColor: DESKTOP_THEME.grey900,
    borderWidth: 1,
    backgroundColor: DESKTOP_THEME.grey1100,
    boxShadow:
      "0px 0px 20px 0px rgba(0, 0, 0, 0.15), 0px 25px 30px 0px rgba(0, 0, 0, 0.35), 0px 4px 4px 0px rgba(0, 0, 0, 0.1), 0px 0px 32px 2px rgba(255, 255, 255, 0.12) inset",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    alignSelf: "center",
    zIndex: 2,
  },
  card: {
    marginTop: 48,
    width: "100%",
    maxWidth: 296,
    gap: 20,
    alignItems: "center",
    alignSelf: "center",
  },
  securityNotice: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    gap: 8,
    paddingVertical: 12,
    zIndex: 3,
  },
  buttons: {
    gap: 12,
    width: "100%",
  },
  calendarNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  calendarNoticeText: {
    textAlign: "center",
  },
  loginButton: {
    borderRadius: 4,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    borderWidth: 1,
    backgroundColor: DESKTOP_THEME.grey900,
    borderColor: DESKTOP_THEME.grey870,
    width: "100%",
    paddingLeft: 16,
    paddingRight: 20,
    gap: 8,
    ...vars.elevations[1],
  },
  securityBadgeSeparator: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomGlowContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: "hidden",
  },
});
