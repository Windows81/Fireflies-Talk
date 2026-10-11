import { IconLock } from "@/assets/svg";
import { ErrorScreen, NotFoundScreen } from "@/components/Error";
import { isForbiddenError, shouldRetryError } from "@/errors";
import { openLoginPopup, useAuth } from "@/features/auth";
import { PlayerProvider } from "@/features/player";
import { toSecFromHHMMSS } from "@/utils/time";
import {
  useGetPlaylistQuery,
  useGetSoundbiteQuery,
} from "@firefliesai/bites-ff.graphql-client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import type { ParamList } from "../types";
import {
  BiteScreenContent,
  BiteScreenContentLoading,
} from "./BiteScreenContent";

export const BiteScreen: FC<NativeStackScreenProps<ParamList, "Bite">> = ({
  route,
  navigation,
}) => {
  const { user } = useAuth();

  const { data, error, loading, refetch } = useGetSoundbiteQuery({
    variables: {
      id: route.params.id,
    },
    returnPartialData: true,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const { data: dataPlaylist } = useGetPlaylistQuery({
    variables: {
      id: route.params.playlist as string,
    },
    skip: !route.params.playlist,
  });

  if (!data?.soundbite?.id && loading) {
    return <BiteScreenContentLoading />;
  }

  // returnPartialData returns empty object {} even if no data
  if (!data?.soundbite?.id && error) {
    if (isForbiddenError(error?.graphQLErrors?.[0] || error)) {
      if (!user) {
        return (
          <ErrorScreen
            login={() => openLoginPopup("soundbite")}
            Icon={IconLock}
            title="This soundbite is private"
            description="Login to check your soundbite access"
          />
        );
      }

      return (
        <ErrorScreen
          Icon={IconLock}
          title="You do not have permission to view this soundbite"
          description="Request the soundbite owner for access"
        />
      );
    }

    return (
      <ErrorScreen
        description={error.message}
        retry={shouldRetryError(error) ? refetch : undefined}
      />
    );
  }

  if (!data?.soundbite)
    return (
      <NotFoundScreen
        title="Soundbite not found"
        description="It does not exist or you do not have access"
      />
    );

  const initialTime = route.params.t
    ? toSecFromHHMMSS(route.params.t)
    : undefined;

  return (
    <PlayerProvider>
      <BiteScreenContent
        bite={data.soundbite}
        playlist={dataPlaylist?.playlist || undefined}
        index={route.params.index}
        navigation={navigation}
        loading={loading}
        initialTime={initialTime}
      />
    </PlayerProvider>
  );
};
