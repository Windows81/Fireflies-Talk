import { useAuth } from "@/features/auth";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";

export const useCanManagePlaylist = (playlist: Playlist) => {
  const { user } = useAuth();
  return user?.id === playlist.userId;
};
