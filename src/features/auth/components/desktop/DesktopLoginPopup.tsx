import { IconClose } from "@/assets/svg";
import { BaseModal } from "@/components/Dialog";
import { RouteNames } from "@/constants";
import { createStyles, useTheme, vars } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { type NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { type FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { create } from "zustand";
import type { ParamList } from "@/screens/types";
import { useAuth } from "../../store";
import {
  DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY,
  getLocalUserFlag,
} from "@/features/user-flags";
import { DesktopLoginView } from "./DesktopLoginView";
import { useCurrentRouteName } from "@/screens/RootNavigation";

interface AuthModalStore {
  isManuallyOpened: boolean;
  open: (fromRef: string) => void;
  close: () => void;
}

const IGNORE_ROUTE_NAMES: string[] = [
  RouteNames.Login,
  RouteNames.IntroVideo,
  RouteNames.Notepad,
  RouteNames.Bite,
  RouteNames.Playlist,
  RouteNames.Diagnostic,
  RouteNames.DictationPill,
];

const useShouldOpenInCurrentRoute = () => {
  const currentRouteName = useCurrentRouteName();
  const isOnMainDesktop = currentRouteName === RouteNames.MainDesktop;
  const introVideoSeen = getLocalUserFlag(DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY);
  // Don't show login on MainDesktop when intro video hasn't been seen yet (avoids blink before redirect to IntroVideo)
  if (isOnMainDesktop && !introVideoSeen) {
    return false;
  }
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

export const DesktopLoginPopup: FC<{
  navigationRef: NavigationContainerRefWithCurrent<ParamList>;
}> = () => {
  const { user } = useAuth();

  const { isManuallyOpened, close } = authModalStore();
  const shouldOpenInCurrentRoute = useShouldOpenInCurrentRoute();

  const theme = useTheme();

  const isVisible = !user && (shouldOpenInCurrentRoute || isManuallyOpened);

  // Don't mount children when hidden – the bottom border animation inside
  // DesktopLoginView runs continuously and RN Web's Modal keeps children
  // mounted even when visible={false}.
  if (!isVisible) return null;

  return (
    <BaseModal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.container(theme)}>
        <BottomSheetModalProvider>
          <View style={styles.content(theme)}>
            <DesktopLoginView onLogin={close} />
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
      </View>
    </BaseModal>
  );
};

const styles = createStyles({
  container: (theme) => ({
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: theme.colors.textStrongBlack,
  }),
  content: (theme) => ({
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.textStrongBlack,
    borderRadius: 20,
    ...vars.elevations[1],
  }),
  closeIcon: {
    position: "absolute",
    top: 25,
    right: 10,
  },
});
