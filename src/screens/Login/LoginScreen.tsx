import { toast } from "@/components/Toast";
import { Config, RouteNames } from "@/constants";
import { captureException } from "@/errors";
import { LoginView, authApi, useAuth } from "@/features/auth";
import { DesktopLoginView } from "@/features/auth/components/desktop/DesktopLoginView";
import { useDesktopLifecycleStore } from "@/features/user-flags";
import { isDesktop } from "@/utils/device";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as NativeCode from "modules/native-code";
import { useCallback, useEffect, useRef, type FC } from "react";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ParamList } from "../types";

export const LoginScreen: FC<NativeStackScreenProps<ParamList, "Login">> = ({
  navigation,
  route,
}) => {
  useEffect(() => {
    if (Platform.OS === "web") {
      WebBrowser.maybeCompleteAuthSession({
        skipRedirectCheck: true,
      });
    }
  }, []);

  const url = ExpoLinking.useURL();
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!url) return;
    const timeout = setTimeout(() => {
      if (url?.includes(Config.DASHBOARD_URL)) {
        // do not open dashboard login url in the app
        NativeCode.openInBrowser(url);
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [url]);

  const onLogin = useCallback(() => {
    navigation.replace(isDesktop ? RouteNames.MainDesktop : RouteNames.Main);
  }, [navigation]);

  const { user } = useAuth();

  const hasNavigated = useRef(false);
  useEffect(() => {
    if (user) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace(
            isDesktop ? RouteNames.MainDesktop : RouteNames.Main,
          );
        }
      }
    }
  }, [user, navigation]);

  useEffect(() => {
    const accessToken = route.params?.access_token || null;
    const refreshToken = route.params?.refresh_token || null;
    const expiresAt =
      (route.params?.expires_at && parseInt(route.params.expires_at, 10)) ||
      null;
    const refreshExpiresAt =
      (route.params?.refresh_expires_at &&
        parseInt(route.params.refresh_expires_at, 10)) ||
      null;
    const state = route.params?.state ?? null;

    if (!accessToken) return;

    if (isDesktop && route.params?.ref) {
      useDesktopLifecycleStore.getState().setInstallRef(route.params.ref);
    }

    authApi
      .login(
        {
          accessToken,
          refreshToken,
          expiresAt,
          refreshExpiresAt,
        },
        state,
      )
      .then(onLogin)
      .catch((error) => {
        captureException(error, {
          tags: {
            section: "login",
          },
        });
        toast({
          title: "Login failed",
          message: error.message,
          type: "error",
        });
      });
  }, [
    route.params?.access_token,
    route.params?.refresh_token,
    route.params?.expires_at,
    route.params?.refresh_expires_at,
    route.params?.state,
    route.params?.ref,
    onLogin,
  ]);

  return (
    <>
      <SafeAreaView style={styles.root}>
        {isDesktop ? (
          <DesktopLoginView onLogin={onLogin} />
        ) : (
          <LoginView onLogin={onLogin} />
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
