import {
  IconCalendar,
  IconGoogleGColor,
  IconLock,
  IconMicrosoftColor,
} from "@/assets/svg";
import { LoadingSpinner } from "@/components/Loading";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { CanceledError, captureException } from "@/errors";
import { createStyles, useTheme, vars } from "@/styles";
import { isDesktop } from "@/utils/device";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { authApi } from "../store";
import { CalendarAccessExplainDialog } from "./CalendarAccessExplainDialog";
import { Header } from "./Header";
import { InfoButton } from "./InfoButton";
import { ManualLogin } from "./ManualLogin";
import { SsoLoginForm } from "./SsoLoginForm";

const LoginButton: FC<{
  icon: ReactNode;
  text: string;
  onPress: () => void;
}> = ({ icon, text, onPress }) => {
  const theme = useTheme();

  return (
    <Pressable
      style={styles.loginButton(theme)}
      onPress={onPress}
      // Prevent auto-focus on web
      {...(isDesktop ? { tabIndex: -1 } : {})}
    >
      {icon}
      <Text
        variant="label1Weight"
        color={isDesktop ? "layerDefault" : "commandNeutralDefault"}
        maxFontSizeMultiplier={1.25}
      >
        {text}
      </Text>
    </Pressable>
  );
};

export const LoginView: FC<{
  onLogin: () => void;
}> = ({ onLogin }) => {
  const [
    isCalendarAccessExplainOpen,
    openCalendarAccessExplain,
    closeCalendarAccessExplain,
  ] = useBooleanState();

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

  const theme = useTheme();

  return (
    <View style={styles.root}>
      <ScrollView
        nativeID="drag-region"
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <Header />
        {loading ? (
          <View style={styles.loading}>
            <LoadingSpinner />
          </View>
        ) : showSsoForm ? (
          <SsoLoginForm
            onBack={() => setShowSsoForm(false)}
            onLogin={onLogin}
          />
        ) : (
          <View style={styles.buttons}>
            <LoginButton
              icon={<IconGoogleGColor width={20} height={20} />}
              text="Continue with Google"
              onPress={() => doLogin("google")}
            />
            <LoginButton
              icon={<IconMicrosoftColor width={20} height={20} />}
              text="Continue with Microsoft"
              onPress={() => doLogin("outlook")}
            />
            <LoginButton
              icon={
                <IconLock
                  width={20}
                  height={20}
                  color={theme.colors.commandNeutralDefault}
                />
              }
              text="Continue with Single Sign-On"
              onPress={() => setShowSsoForm(true)}
            />
            <ManualLogin onLogin={onLogin} />
          </View>
        )}
        {!showSsoForm && (
          <TouchableOpacity
            onPress={openCalendarAccessExplain}
            style={styles.calendarNotice}
          >
            <IconCalendar
              width={16}
              height={16}
              color={theme.colors.textHint}
            />
            <Text variant="body2Regular" color="textHint" textAlign="center">
              Why does Fireflies need my calendar access?
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <View style={styles.securityBanner(theme)}>
        <IconLock
          width={16}
          height={16}
          color={theme.colors.informationStaticGreenText}
        />
        <Text
          variant="body3Weight"
          color="informationStaticGreenText"
          allowFontScaling={false}
        >
          SECURED BY 256-BIT ENCRYPTION
        </Text>
      </View>
      <InfoButton />
      <CalendarAccessExplainDialog
        isOpen={isCalendarAccessExplainOpen}
        close={closeCalendarAccessExplain}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    width: "100%",
    height: "100%",
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
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
    opacity: 0.8,
    marginTop: 18,
  },
  loginButton: (theme) => ({
    borderRadius: 4,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    backgroundColor: theme.colors.layerDefault,
    borderColor: theme.colors.borderStaticSubtle,
    width: "100%",
    paddingHorizontal: 24,
    gap: 16,
    ...vars.elevations[1],
  }),
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  securityBanner: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: theme.colors.informationStaticGreenSubtle,
  }),
});
