import { IconClose } from "@/assets/svg";
import { BaseModal } from "@/components/Dialog";
import { RouteNames } from "@/constants";
import { useCurrentRouteName } from "@/screens/RootNavigation";
import { createStyles, useTheme, vars } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { type NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { type FC } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { create } from "zustand";
import type { ParamList } from "../../../screens/types";
import { useAuth } from "../store";
import { LoginView } from "./LoginView";

interface AuthModalStore {
  isManuallyOpened: boolean;
  open: (fromRef: string) => void;
  close: () => void;
}

const IGNORE_ROUTE_NAMES: string[] = [
  RouteNames.Login,
  RouteNames.Notepad,
  RouteNames.Bite,
  RouteNames.Playlist,
  RouteNames.Diagnostic,
];

const useShouldOpenInCurrentRoute = () => {
  const currentRouteName = useCurrentRouteName();
  return !currentRouteName || !IGNORE_ROUTE_NAMES.includes(currentRouteName);
};

const authModalStore = create<AuthModalStore>((set) => ({
  isManuallyOpened: false,
  open: (fromRef: string) => {
    tracker.track(TRACKING_EVENTS.LOGIN_POPUP_OPENED, {
      from: fromRef,
    });

    set({ isManuallyOpened: true });
  },
  close: () => {
    set({ isManuallyOpened: false });
  },
}));

export const openLoginPopup = (fromRef: string) => {
  authModalStore.getState().open(fromRef);
};

export const useIsLoginPopupVisible = () => {
  const { isManuallyOpened } = authModalStore();
  const shouldOpenInCurrentRoute = useShouldOpenInCurrentRoute();
  return isManuallyOpened || shouldOpenInCurrentRoute;
};

export const LoginPopup: FC<{
  navigationRef: NavigationContainerRefWithCurrent<ParamList>;
}> = () => {
  const { user } = useAuth();

  const { isManuallyOpened, close } = authModalStore();
  const shouldOpenInCurrentRoute = useShouldOpenInCurrentRoute();

  const theme = useTheme();

  return (
    <BaseModal
      visible={!user && (shouldOpenInCurrentRoute || isManuallyOpened)}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BlurView
          style={styles.container(theme)}
          intensity={20}
          tint={theme.name === "light" ? "light" : "systemThickMaterialDark"}
          experimentalBlurMethod="dimezisBlurView"
        >
          <BottomSheetModalProvider>
            <View style={styles.content(theme)}>
              <LoginView onLogin={close} />
              {isManuallyOpened && (
                <TouchableOpacity
                  style={styles.closeIcon}
                  onPress={close}
                  hitSlop={10}
                >
                  <IconClose
                    color={theme.colors.commandHintDefault}
                    width={25}
                    height={25}
                  />
                </TouchableOpacity>
              )}
            </View>
          </BottomSheetModalProvider>
        </BlurView>
      </KeyboardAvoidingView>
    </BaseModal>
  );
};

const styles = createStyles({
  container: (theme) => ({
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 10,
    backgroundColor: theme.colors.miscellaneousOverlay,
  }),
  content: (theme) => ({
    width: "100%",
    height: "100%",
    maxHeight: 700,
    maxWidth: 600,
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 20,
    ...vars.elevations[1],
  }),
  closeIcon: {
    position: "absolute",
    top: 25,
    right: 10,
  },
});
