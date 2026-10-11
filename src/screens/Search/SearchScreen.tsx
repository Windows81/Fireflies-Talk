import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import { BiteSearch } from "./bite/BiteSearch";
import { SearchBar } from "./components/SearchBar";
import { MeetingSearch } from "./meeting/MeetingSearch";
import { PlaylistSearch } from "./playlist/PlaylistSearch";

export const SearchScreen: FC<NativeStackScreenProps<ParamList, "Search">> = ({
  navigation,
  route,
}) => {
  // Committed query (bite/playlist search still fire on submit). The live
  // input value below drives meeting search, which debounces on its own.
  const committedQuery = route.params?.q ?? "";
  const [inputValue, setInputValue] = useState(committedQuery);
  const commitSearch = useCallback(
    (value: string) => {
      navigation.setParams({ q: value });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root}>
      <SearchBar
        value={inputValue}
        onChangeText={setInputValue}
        onSubmit={commitSearch}
        entity={route.params?.entity || "meeting"}
      />
      {route.params?.entity === "playlist" ? (
        <PlaylistSearch searchQuery={committedQuery} mine={route.params.mine} />
      ) : route.params?.entity === "bite" ? (
        <BiteSearch searchQuery={committedQuery} mine={route.params.mine} />
      ) : (
        <MeetingSearch
          searchQuery={inputValue}
          setSearchQuery={setInputValue}
          submittedQuery={committedQuery}
          onSubmitQuery={commitSearch}
          channelId={route.params?.channel}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
