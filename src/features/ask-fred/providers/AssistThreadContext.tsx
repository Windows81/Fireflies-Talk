import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useThread } from "@firefliesai/fred-react";
import type { Thread } from "@firefliesai/fred-client";
import { Logger } from "@/logger";
import { LIVE_ASSIST_SUBMIT_PARAMS } from "../constants/config";
import { createFredClient } from "../utils/fred-client";
import { findMeetingAskFredThread } from "../utils/meeting-thread";
import { useAuth } from "@/features/auth";
import { isAskFredCreditsError } from "../helpers/isAskFredCreditsError";

const logger = new Logger("AssistThreadContext");

const AssistThreadContext = createContext<AssistThreadContextType | undefined>(
  undefined,
);

export interface AssistThreadContextType {
  isAssistPanelOpen: boolean;
  setAssistPanelOpen: (open: boolean) => void;
  askFred: (
    question: string,
    suggestionSource?: string,
    refSource?: string,
  ) => Promise<void>;
  isAnyAssistLoading: boolean;
  hasOptimisticMessage: boolean;
  currentThreadId: string | null;
}

export const useAssistThread = () => {
  const context = useContext(AssistThreadContext);

  if (!context)
    throw new Error(
      "useAssistThread must be used within an AssistThreadProvider",
    );

  return context;
};

interface AssistThreadProviderProps {
  children: ReactNode;
  meetingId: string;
  onCreditsExhausted?: () => void;
}

export const AssistThreadProvider = ({
  children,
  meetingId,
  onCreditsExhausted,
}: AssistThreadProviderProps) => {
  const [isAssistPanelOpen, setAssistPanelOpen] = useState(false);
  const [isAnyAssistLoading, setIsAnyAssistLoading] = useState(false);
  const [hasOptimisticMessage, setHasOptimisticMessage] = useState(false);

  // Thread recovery state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);

  const { submit, messages, loadThread, setThread, thread } = useThread();
  const { user } = useAuth();
  const isUserLoggedIn = Boolean(user?.id);

  // Create FredClient for fetching threads
  const fredClient = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createFredClient();
  }, []);

  // Fetch threads using fredClient.getThreads() directly
  const fetchThreads = useCallback(
    async (meetingIdToFetch: string) => {
      if (!fredClient) return;
      if (!isUserLoggedIn) return;
      try {
        const fetchedThreads = await fredClient.getThreads({
          meetingId: meetingIdToFetch,
        });
        setThreads(fetchedThreads);
      } catch (err) {
        logger.error("Error fetching threads:", { err });
      }
    },
    [fredClient, isUserLoggedIn],
  );

  // Reset and fetch threads when meetingId changes
  useEffect(() => {
    if (!isUserLoggedIn) return;
    if (!meetingId) return;

    // Reset thread state
    setThread(null);
    setCurrentThread(null);

    // Fetch threads for this meeting
    fetchThreads(meetingId);
  }, [meetingId, fetchThreads, isUserLoggedIn, setThread]);

  // Find and load existing thread for this meeting ID
  useEffect(() => {
    if (!meetingId || !threads || !fredClient || !isUserLoggedIn) return;

    const existingThread = findMeetingAskFredThread(threads, meetingId);
    if (!existingThread) {
      setThread(null);
      setCurrentThread(null);
      return;
    }

    if (currentThread?.id !== existingThread.id) {
      setCurrentThread(existingThread);
      loadThread(existingThread.id).catch((err) =>
        logger.error("Error loading thread:", { err }),
      );
    }
  }, [
    meetingId,
    threads,
    fredClient,
    isUserLoggedIn,
    currentThread,
    loadThread,
    setThread,
  ]);

  // Track when messages change to hide optimistic UI
  useEffect(() => {
    if (hasOptimisticMessage && messages && messages.length > 0) {
      // Check if the latest message has any content (indicating streaming started)
      const latestMessage = messages[messages.length - 1];
      const hasContent = latestMessage?.answer?.some(
        (part) => "text" in part && part.text && part.text.trim(),
      );

      if (hasContent) {
        setHasOptimisticMessage(false);
      }
    }
  }, [messages, hasOptimisticMessage]);

  const askFred = useCallback(
    async (question: string, suggestionSource?: string, refSource?: string) => {
      logger.info("askFred called", {
        questionLength: question.length,
        isAnyAssistLoading,
        threadId: thread?.id,
      });

      const trimmedQuestion = question.trim();
      if (!trimmedQuestion) {
        logger.warn("Empty question submitted to askFred, ignoring");
        return;
      }

      // Simple guard - just check our own loading state
      if (isAnyAssistLoading) {
        logger.warn("isAnyAssistLoading is true, ignoring duplicate request");
        return;
      }

      setIsAnyAssistLoading(true);
      setHasOptimisticMessage(true);

      try {
        await submit({
          input: trimmedQuestion,
          source: LIVE_ASSIST_SUBMIT_PARAMS.source,
          refSource: refSource || LIVE_ASSIST_SUBMIT_PARAMS.refSource,
          ...(suggestionSource && { suggestionSource }),
        });
      } catch (submitError) {
        logger.error("Error submitting to Fred:", { submitError });

        // Check if error indicates credit depletion
        const errorMessage =
          submitError instanceof Error
            ? submitError.message.toLowerCase()
            : String(submitError).toLowerCase();
        logger.error(`Fred error message: ${errorMessage}`);

        if (isAskFredCreditsError(submitError) && onCreditsExhausted) {
          logger.info(
            "Credit depletion detected from Fred API error, triggering paywall",
          );
          onCreditsExhausted();
        }
      } finally {
        setIsAnyAssistLoading(false);
        setHasOptimisticMessage(false);
      }
    },
    [submit, isAnyAssistLoading, thread, onCreditsExhausted],
  );

  const value: AssistThreadContextType = {
    isAssistPanelOpen,
    setAssistPanelOpen,
    askFred,
    isAnyAssistLoading,
    hasOptimisticMessage,
    currentThreadId: currentThread?.id || null,
  };

  return (
    <AssistThreadContext.Provider value={value}>
      {children}
    </AssistThreadContext.Provider>
  );
};
