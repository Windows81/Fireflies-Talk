import type { FC } from "react";
import { EmptyState } from "../../components/EmptyState";

export const FeedEmptyState: FC = () => {
  return (
    <EmptyState
      title="Meet Your AI-Powered Feed"
      description="Stay up to date with your meetings, catch up on important discussions in a glance."
      openAddModalFromRef="home/feed-empty"
    />
  );
};
