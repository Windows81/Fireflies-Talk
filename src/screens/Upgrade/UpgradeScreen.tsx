import { DashboardWebview } from "@/features/legacy";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, type FC } from "react";
import type { ParamList } from "../types";
import {
  apolloClient,
  GetCurrentUserDocument,
  type GetCurrentUserQuery,
  type GetCurrentUserQueryVariables,
} from "@/graphql";
import { useFocusEffect } from "@react-navigation/native";
import { authApi } from "@/features/auth";
import { captureException } from "@/errors";

export const UpgradeScreen: FC<
  NativeStackScreenProps<ParamList, "Upgrade">
> = ({ route }) => {
  const queryParams = route.params?.query ?? "";

  useFocusEffect(
    useCallback(() => {
      // when unmounting the Upgrade webpage, should update the user subscription status
      return () => {
        const updateUserStatus = async () => {
          try {
            const response = await apolloClient.query<
              GetCurrentUserQuery,
              GetCurrentUserQueryVariables
            >({
              query: GetCurrentUserDocument,
              fetchPolicy: "network-only",
            });
            const paidUserStatus = response.data.user?.paidUser;

            if (paidUserStatus) {
              await authApi.updateUser({ paidUser: paidUserStatus });
            }
          } catch (err) {
            captureException(err, {
              tags: {
                section: "upgrade-paid-status-update",
              },
            });
          }
        };

        void updateUserStatus();
      };
    }, []),
  );

  return (
    <DashboardWebview
      path={`/upgrade${queryParams}`}
      iOSUserAgent="Mozilla/5.0 (iPhone; CPU iPhone OS like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile"
    />
  );
};
