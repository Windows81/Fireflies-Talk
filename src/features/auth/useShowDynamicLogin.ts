import { useEffect, useRef } from "react";
import {
  openLoginPopup,
  useIsLoginPopupVisible,
} from "./components/LoginPopup";
import { useAuth } from "./store";

// show after 5s, 10s, 15s, 20s, 25s, 30s, 30s, 30s, ..
const showAfterDynamic = (time: number) => {
  if (time <= 4) {
    return (time + 1) * 5000;
  }
  return 30000;
};

export const useShowDynamicLogin = (
  fromRef: string,
  isGuestAccessEnabled?: boolean | null,
) => {
  const { user } = useAuth();
  const showLoginCount = useRef<number>(0);
  const isLoginPopupVisible = useIsLoginPopupVisible();

  useEffect(() => {
    let loginPopupTimer: ReturnType<typeof setInterval> | undefined;

    if (!user && !isLoginPopupVisible && !isGuestAccessEnabled) {
      loginPopupTimer = setTimeout(() => {
        openLoginPopup(fromRef);
        showLoginCount.current += 1;
      }, showAfterDynamic(showLoginCount.current));
    }

    return () => {
      clearTimeout(loginPopupTimer);
    };
  }, [fromRef, user, isLoginPopupVisible, isGuestAccessEnabled]);
};
