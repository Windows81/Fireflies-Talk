import { imageSoundbiteMock, imageSoundbiteMockDark } from "@/assets/images";
import { IconSearch } from "@/assets/svg";
import { BiteListItem, LoadingBiteListItem } from "@/components/Bite";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Dialog } from "@/components/Dialog";
import { TextInput } from "@/components/Input";
import { MessageView } from "@/components/Message";
import { QueryListView } from "@/components/QueryListView";
import { SegmentedControl } from "@/components/SegmentedControl";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useFetchMore } from "@/graphql";
import { createStyles } from "@/styles";
import { pluralize } from "@/utils/pluralize";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import {
  useGetSoundbitesQuery,
  useUpdatePlaylistBitesMutation,
  type Playlist,
} from "@firefliesai/bites-ff.graphql-client";
import type { ListRenderItem } from "@shopify/flash-list";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type FC,
} from "react";
import { Pressable, View } from "react-native";

const LIMIT = 20;

const AddToPlaylistContext = createContext(
  {} as {
    selected: string[];
    toggle: (id: string) => void;
  },
);

const AddableSoundbite: FC<{
  bite: Soundbite;
  index: number;
}> = ({ bite }) => {
  const { selected, toggle } = useContext(AddToPlaylistContext);
  return (
    <Pressable
      style={styles.item}
      onPress={() => {
        toggle(bite.id);
      }}
    >
      <Checkbox value={selected.includes(bite.id)} pointerEvents="none" />
      <BiteListItem bite={bite} style={styles.bite} />
    </Pressable>
  );
};

export const LoadingAddableSoundbite: FC = () => (
  <View style={styles.item}>
    <Checkbox disabled />
    <LoadingBiteListItem style={styles.bite} />
  </View>
);

const renderItem: ListRenderItem<Soundbite> = ({ item, index }) => (
  <AddableSoundbite bite={item} index={index} />
);

const SoundbiteResults: FC<{
  search: string;
  mine: boolean;
}> = ({ search: searchProp, mine }) => {
  const search = searchProp.trim();

  const { data, fetchMore, refetch, loading, error } = useGetSoundbitesQuery({
    variables: {
      limit: LIMIT,
      mine,
      myTeam: !mine,
      query: search ? search : undefined,
    },
    onError(err) {
      toast({
        title: "Could not load soundbites",
        type: "error",
        message: err.message,
      });
    },
    errorPolicy: "all",
  });

  const [onLoadMore, fetchMoreState] = useFetchMore({
    data,
    fetchMore,
    limit: LIMIT,
    path: "soundbites",
  });

  return (
    <View style={styles.content}>
      <Text variant="title3Weight" color="textMuted" style={styles.listTitle}>
        {search ? `Search results for "${search}"` : "Recent soundbites"}
      </Text>
      <QueryListView<Soundbite>
        data={data?.soundbites}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onLoadMore={onLoadMore}
        fetchMoreState={fetchMoreState}
        LoadingItemComponent={LoadingAddableSoundbite}
        refetch={refetch}
        emptyState={
          search ? (
            <MessageView
              headerImage={imageSoundbiteMock}
              headerImageDark={imageSoundbiteMockDark}
              title={`No soundbites found for "${search}"`}
            />
          ) : (
            <MessageView
              headerImage={imageSoundbiteMock}
              headerImageDark={imageSoundbiteMockDark}
              title="You have no soundbites"
            />
          )
        }
        errorStateTitle="Could not load soundbites"
        loading={loading}
        error={error}
      />
    </View>
  );
};

const SearchTextInput: FC<{
  setSearch: (s: string) => void;
}> = ({ setSearch }) => {
  const [value, setValue] = useState("");

  return (
    <TextInput
      placeholder="Search"
      Icon={IconSearch}
      clearable
      value={value}
      onValueChange={setValue}
      variant="filled"
      onSubmitEditing={(e) => setSearch(e.nativeEvent.text.trim())}
      onClear={() => setSearch("")}
    />
  );
};

const AddBitesDialogContent: FC<{
  playlist: Playlist;
  close: () => void;
}> = ({ playlist, close }) => {
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const [updatePlaylistBites, { loading }] = useUpdatePlaylistBitesMutation({
    variables: {
      id: playlist.id,
      adding: selected,
    },
    onCompleted() {
      toast({
        type: "success",
        message: "Soundbites added to playlist",
      });
    },
    onError(err) {
      toast({
        title: "Could not add soundbites to playlist",
        type: "error",
        message: err.message,
      });
    },
  });

  const onAdd = useCallback(() => {
    if (loading) return;
    updatePlaylistBites();
    close();
  }, [loading, updatePlaylistBites, close]);

  const [tab, setTab] = useState<"mine" | "all">("mine");
  const mine = tab === "mine";

  return (
    <AddToPlaylistContext.Provider value={{ selected, toggle }}>
      <View style={styles.search}>
        <SearchTextInput setSearch={setSearch} />
        <SegmentedControl
          data={[
            { value: "mine", label: "My Soundbites" },
            { value: "all", label: "All Soundbites" },
          ]}
          value={tab}
          onChange={setTab}
          fullWidth
        />
      </View>
      <SoundbiteResults search={search} mine={mine} />
      <View style={[styles.actions]}>
        <Button disabled={!selected.length} size="lg" onPress={onAdd}>
          Add {selected.length} {pluralize("soundbite", selected.length)}
        </Button>
      </View>
    </AddToPlaylistContext.Provider>
  );
};

export const AddBitesDialog: FC<{
  isOpen: boolean;
  close: () => void;
  playlist: Playlist;
}> = ({ isOpen, close, playlist }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="fullscreen">
      <Dialog.Header>Add soundbites</Dialog.Header>
      <AddBitesDialogContent playlist={playlist} close={close} />
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  listTitle: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  item: {
    flexDirection: "row",
    width: "100%",
    paddingLeft: 16,
  },
  bite: {
    flex: 1,
  },
  actions: {
    padding: 16,
    width: "100%",
  },
});
