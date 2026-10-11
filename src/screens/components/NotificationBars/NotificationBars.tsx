import type { FC } from "react";

import {
  OngoingUploadNotificationBar,
  useOngoingUploadNotificationBarVisible,
} from "./OngoingUploadNotificationBar";

export const NotificationBars: FC = () => {
  const isOngoingUploadNotificationVisible =
    useOngoingUploadNotificationBarVisible();
  if (!isOngoingUploadNotificationVisible) {
    return null;
  }
  return <OngoingUploadNotificationBar />;
};

export const useIsNotificationBarsVisible = () => {
  const isOngoingUploadNotificationVisible =
    useOngoingUploadNotificationBarVisible();

  return isOngoingUploadNotificationVisible;
};
