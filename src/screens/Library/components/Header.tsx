import { IconSearch } from "@/assets/svg";
import { HeaderIconButton, HeaderSideContainer } from "@/components/Layout";
import { RouteNames } from "@/constants";
import { RootNavigation } from "@/screens/RootNavigation";
import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import type { FC } from "react";
import { YouHeaderButton } from "src/screens/You";
import type { ParamList } from "src/screens/types";

export const HeaderRight: FC = () => {
  const route = useRoute<RouteProp<ParamList, "Library">>();

  return (
    <HeaderSideContainer forcePadding>
      <HeaderIconButton
        Icon={IconSearch}
        label={`Search ${
          route.params?.tab === "playlists" ? "playlists" : "soundbites"
        }`}
        onPress={() =>
          RootNavigation.navigate(RouteNames.Search, {
            entity: route.params?.tab === "playlists" ? "playlist" : "bite",
          })
        }
      />
      <YouHeaderButton />
    </HeaderSideContainer>
  );
};
