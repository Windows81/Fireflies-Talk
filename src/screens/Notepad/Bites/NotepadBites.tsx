import { imageSoundbiteMock, imageSoundbiteMockDark } from "@/assets/images";
import { IconPlus } from "@/assets/svg";
import { BiteListItem, LoadingBiteListItem } from "@/components/Bite";
import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { MessageView } from "@/components/Message";
import { QueryListView } from "@/components/QueryListView";
import { RouteNames } from "@/constants";
import { BiteBottomSheetMenu } from "@/features/bite";
import { useDownloadedMeetingPayload } from "@/features/downloads";
import type { Soundbite } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { useGetSoundbitesQuery } from "@firefliesai/bites-ff.graphql-client";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { ListRenderItem } from "@shopify/flash-list";
import type { FC } from "react";
import { useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const NotepadBites: FC<{
  meeting: Meeting;
  openCreateSoundbite: () => void;
}> = ({ meeting, openCreateSoundbite }) => {
  const { data, loading, error, refetch } = useGetSoundbitesQuery({
    variables: {
      meetingId: meeting.id,
    },
    errorPolicy: "all",
  });

  // offline fallback: render the downloaded soundbites list
  const { payload } = useDownloadedMeetingPayload(meeting.id);

  const biteForMenuRef = useRef<Soundbite | null>(null);
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState(false);

  const renderItem = useCallback<ListRenderItem<Soundbite>>(
    ({ item }) => {
      return (
        <LinkView
          href={{
            pathname: RouteNames.Bite,
            params: {
              id: item.id,
            },
          }}
          onLongPress={() => {
            biteForMenuRef.current = item;
            openMenu();
          }}
          animated
        >
          <BiteListItem bite={item} />
        </LinkView>
      );
    },
    [openMenu],
  );

  return (
    <>
      <SafeAreaView edges={["bottom", "left", "right"]} style={styles.root}>
        <QueryListView
          data={data?.soundbites ?? payload?.soundbites}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refetch={refetch}
          LoadingItemComponent={LoadingBiteListItem}
          emptyState={
            <MessageView
              headerImage={imageSoundbiteMock}
              headerImageDark={imageSoundbiteMockDark}
              title="Clip out important moments"
              description="Select desired transcript to create soundbites or let Fireflies AI curate magic soundbites automatically."
              action={
                meeting.captions?.length ? (
                  <Button
                    Icon={IconPlus}
                    onPress={openCreateSoundbite}
                    variant="secondary"
                  >
                    Create Soundbite
                  </Button>
                ) : undefined
              }
            />
          }
          errorStateTitle="Could not load soundbites"
          loading={loading}
          error={error}
        />
      </SafeAreaView>
      {biteForMenuRef.current && (
        <BiteBottomSheetMenu
          bite={biteForMenuRef.current}
          isOpen={isOpenMenu}
          close={closeMenu}
          fromRef="notepad/bites"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
});
