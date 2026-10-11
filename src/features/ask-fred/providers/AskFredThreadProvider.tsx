import {
  useCallback,
  useEffect,
  useMemo,
  type FC,
  type PropsWithChildren,
} from "react";
import { ThreadProvider, useThread } from "@firefliesai/fred-react";
import { useAuth } from "@/features/auth";
import { createFredClient } from "../utils/fred-client";
import { findMeetingAskFredThread } from "../utils/meeting-thread";
import { Logger } from "@/logger";

const logger = new Logger("AskFredThreadProvider");

/**
 * Inner component that auto-loads existing thread history from the server.
 * Must be rendered inside ThreadProvider to access useThread().
 * Mirrors dashboard's AskFredProviderInner fetchThreads logic.
 */
const ThreadHistoryLoader: FC<PropsWithChildren<{ meetingId: string }>> = ({
  children,
  meetingId,
}) => {
  const { user } = useAuth();
  const { loadThread, setThread } = useThread();

  const fredClient = useMemo(() => createFredClient(), []);

  const fetchThreads = useCallback(
    async (id: string) => {
      if (!fredClient || !user) return;
      try {
        const fetchedThreads = await fredClient.getThreads({
          meetingId: id,
        });
        const existingThread = findMeetingAskFredThread(fetchedThreads, id);
        if (existingThread) {
          loadThread(existingThread.id);
        } else {
          setThread(null);
        }
      } catch (err) {
        logger.error("Error fetching threads:", err);
      }
    },
    [fredClient, user, loadThread, setThread],
  );

  useEffect(() => {
    if (!user) return;
    setThread(null);
    fetchThreads(meetingId);
  }, [meetingId, fetchThreads, user, setThread]);

  return <>{children}</>;
};

/**
 * Wraps ThreadProvider with auto-loading of existing thread history.
 * Place this high in the component tree (e.g. NotepadScreenContent)
 * so thread state survives modal close/sidebar switches.
 */
export const AskFredThreadProvider: FC<
  PropsWithChildren<{ meetingId: string }>
> = ({ children, meetingId }) => {
  return (
    <ThreadProvider meetingId={meetingId}>
      <ThreadHistoryLoader meetingId={meetingId}>
        {children}
      </ThreadHistoryLoader>
    </ThreadProvider>
  );
};
