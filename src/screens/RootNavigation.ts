import {
  StackActions,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { create } from "zustand";
import type { ParamList } from "./types";
import { RouteNames } from "@/constants";
import { isDesktop } from "@/utils/device";

export const navigationRef = createNavigationContainerRef<ParamList>();

interface NavigationStateStore {
  currentRouteName: string;
  currentRouteParams: Readonly<object | undefined> | undefined;
  setCurrentRoute: (
    routeName: string,
    params?: Readonly<object | undefined>,
  ) => void;
}

// Store for navigation state that works outside navigation context
export const useNavigationStateStore = create<NavigationStateStore>((set) => ({
  currentRouteName: isDesktop ? RouteNames.MainDesktop : RouteNames.Main,
  currentRouteParams: undefined,
  setCurrentRoute: (
    routeName: string,
    params?: Readonly<object | undefined>,
  ) => {
    set({ currentRouteName: routeName, currentRouteParams: params });
  },
}));

export function navigate<T extends keyof ParamList>(
  name: T,
  params?: ParamList[T],
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as string, params as object | undefined);
  }
}

/**
 * Returns to the desktop home screen already in the stack. `popTo`, not
 * `navigate`: in React Navigation 7 navigating to a screen that is not the
 * current one pushes a second copy of it rather than returning to the one
 * already there, which is how the home screen ends up mounted many times over.
 * `merge` leaves its params alone so nothing that reads them changes.
 */
export function popToDesktopHome(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    StackActions.popTo(RouteNames.MainDesktop, undefined, { merge: true }),
  );
}

export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  } else {
    return undefined;
  }
}

export const useCurrentRouteName = () => {
  return useNavigationStateStore((state) => state.currentRouteName);
};

export const useCurrentRouteParams = () => {
  return useNavigationStateStore((state) => state.currentRouteParams);
};

export const RootNavigation = {
  navigate,
  getCurrentRoute,
};
