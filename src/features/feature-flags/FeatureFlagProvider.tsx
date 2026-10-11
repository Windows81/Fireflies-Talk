import { useGetFeaturesQuery } from "@/graphql";
import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import { useEffect, useMemo, type FC, type PropsWithChildren } from "react";
import { useAuth } from "../auth";
import { storage } from "../storage";
import { FEATURE_FLAG_STORAGE_KEY } from "./featureFlags";
import { useFeatureFlagsResolved } from "./featureFlagsResolved.store";
import { isDesktop, isDictationPillWindow } from "@/utils/device";
export {
  useFeature,
  useFeatureIsOn,
  useFeatureValue,
} from "@growthbook/growthbook-react";

const persistedFeatureFlags = storage.getItem(FEATURE_FLAG_STORAGE_KEY) || "{}";

export const FeatureFlagProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  // The pill window only needs cached flags; fetching here toasted
  // "Could not connect to server" into the overlay on every launch.
  const skipNetwork = isDictationPillWindow();

  const { data, refetch } = useGetFeaturesQuery({
    skip: skipNetwork,
    // we can't use MOBILE_POLLING_INTERVALS flag here since it's not wrapped by flag-provider yet
    // desktop apps will stay alive and will never refresh the flags if we don't have polling
    pollInterval: isDesktop && !skipNetwork ? 4 * 60 * 60 * 1000 : 0, // 4hr for desktop apps, skip for others
    onCompleted: (queryResponse) => {
      if (queryResponse?.getFeatures.features) {
        storage.setItem(
          FEATURE_FLAG_STORAGE_KEY,
          JSON.stringify(queryResponse.getFeatures.features),
        );
      }
    },
  });

  useEffect(() => {
    if (skipNetwork) return;
    const userId = user?.id ?? null;
    const markResolved = () =>
      useFeatureFlagsResolved.getState().setResolvedUserId(userId);
    // apolloClient is not ready yet with new tokens
    const timeoutId = setTimeout(() => {
      refetch().then(markResolved, markResolved);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [user?.id, refetch, skipNetwork]);

  const gb = useMemo(() => {
    return new GrowthBook({
      user: { ...user },
      features: data?.getFeatures.features || JSON.parse(persistedFeatureFlags),
    });
  }, [data?.getFeatures.features, user]);

  return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>;
};
