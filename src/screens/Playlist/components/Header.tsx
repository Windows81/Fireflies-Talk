import { IconMoreVertical, IconPlus, IconShare } from "@/assets/svg";
import { HeaderIconButton, HeaderSideContainer } from "@/components/Layout";
import { useAuth } from "@/features/auth";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";

export const HeaderRight: FC<{
  openShare: () => void;
  openMenu: () => void;
  openAdd: () => void;
  playlist: Playlist;
}> = ({ openShare, openMenu, openAdd, playlist }) => {
  const { user } = useAuth();

  const isOwner = user?.id === playlist.userId;

  return (
    <HeaderSideContainer>
      {isOwner && (
        <HeaderIconButton
          Icon={IconPlus}
          label="Add to playlist"
          onPress={openAdd}
        />
      )}
      <HeaderIconButton Icon={IconShare} label="Share" onPress={openShare} />
      <HeaderIconButton
        Icon={IconMoreVertical}
        label="More"
        onPress={() => {
          openMenu();
          tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
            type: "playlist",
            from: "screen/header",
            id: playlist.id,
            privacy: playlist.privacy,
          });
        }}
      />
    </HeaderSideContainer>
  );
};
