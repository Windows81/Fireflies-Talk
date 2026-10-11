import type { AuthUser } from "@/features/auth";
import { requestPermissionAndGetTokens } from "@/utils/notifications";
import {
  useRegisterDeviceTokenMutation,
  type DevicePlatform,
} from "@firefliesai/notifications-ff.graphql-client";
import { captureException } from "@sentry/react-native";
import { nativeBuildVersion } from "expo-application";
import { isDevice, osVersion } from "expo-device";
import { useEffect } from "react";
import { Platform } from "react-native";

export const usePushNotificationRegistration = (user: AuthUser | null) => {
  const [registerDeviceToken] = useRegisterDeviceTokenMutation({
    onError(error) {
      captureException(error, {
        tags: { section: "push-notification-registration" },
      });
    },
  });

  useEffect(() => {
    if (!user?.id || !isDevice) return;

    (async () => {
      try {
        const tokens = await requestPermissionAndGetTokens();

        if (!(tokens?.expoToken || tokens?.deviceToken)) {
          console.warn("No tokens received from requestPermissionAndGetToken");
          return;
        }

        const buildNum = Number(nativeBuildVersion);
        if (Number.isNaN(buildNum)) {
          console.error("Invalid build number");
          return;
        }

        registerDeviceToken({
          variables: {
            expoToken: tokens.expoToken,
            deviceToken: tokens.deviceToken,
            platform: Platform.OS as DevicePlatform,
            osVersion,
            buildNumber: buildNum,
          },
        });
      } catch (error) {
        captureException(error, {
          tags: { section: "push-notification-registration" },
        });
      }
    })();
  }, [user?.id, registerDeviceToken]);
};
