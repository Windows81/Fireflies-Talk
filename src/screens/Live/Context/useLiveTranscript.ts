import { useCallback, useEffect, useRef, useState } from "react";
import { useGetLiveTranscriptQuery } from "@/graphql";
import type { LiveTranscriptItem } from "@/graphql";
import type { Caption } from "@/features/transcript";
import { toast } from "@/components/Toast";
import type { GroupedCaption } from "@/components/Transcript";
import { InteractionManager } from "react-native";
import { isDesktop } from "@/utils/device";

// same consts and group logic copied from dashboard-ff
// 100ms is nothing for desktop CPUs with O(n), but mobile drains battery a lot
const UPDATE_THROTTLE_MS = isDesktop ? 100 : 1000;
const MERGE_TIME_THRESHOLD = 15;
const PARAGRAPH_BREAK_THRESHOLD = 150;
const FLASHLIST_RENDER_THRESHOLD = 5;
const UNASSIGNED_SPEAKER_KEY = "unassigned";
const UNASSIGNED_SPEAKER_LABEL = "Unassigned";

type ElectronStreamingTranscriptEventData = {
  parseId?: unknown;
  transcriptId?: unknown;
  sentence?: unknown;
  time?: unknown;
  endTime?: unknown;
  speakerName?: unknown;
};

const isUnassignedSpeaker = (
  speakerName?: string | null,
  speakerId?: string | number | null,
) => {
  const normalized = `${speakerName ?? speakerId ?? ""}`.trim().toLowerCase();
  return normalized === UNASSIGNED_SPEAKER_KEY;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
};

const stablePositiveHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash === 0 ? 1 : hash;
};

const toLiveTranscriptItemFromElectron = (
  payload: unknown,
): LiveTranscriptItem | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as ElectronStreamingTranscriptEventData;
  const sentence =
    typeof data.sentence === "string" ? data.sentence.trim() : "";
  if (!sentence) return null;

  const time = toFiniteNumber(data.time, 0);
  const endTime = toFiniteNumber(data.endTime, time);

  const parseIdCandidate =
    typeof data.parseId === "string" ? data.parseId : undefined;
  const transcriptIdCandidate =
    typeof data.transcriptId === "string" ? data.transcriptId : undefined;
  const baseTranscriptId =
    transcriptIdCandidate ??
    parseIdCandidate ??
    String(Math.max(0, Math.floor(endTime * 1000)));
  const transcript_id = /^\d+$/.test(baseTranscriptId)
    ? baseTranscriptId
    : String(stablePositiveHash(baseTranscriptId));

  const speakerName =
    typeof data.speakerName === "string" && data.speakerName.trim().length > 0
      ? data.speakerName.trim()
      : "Speaker";
  const speakerId = stablePositiveHash(speakerName.toLowerCase());

  return {
    parseId: parseIdCandidate ?? transcript_id,
    transcript_id,
    sentence,
    text: sentence,
    time,
    endTime,
    speaker_name: speakerName,
    speaker: speakerId,
    speaker_id: speakerId,
  };
};

export type LiveTranscript = {
  loading: boolean;
  groupedCaptions: GroupedCaption[];
  hasTranscript: boolean;
};

/**
 * Merge captions that are close together in time
 * and have the same speaker.
 */
const mergeTranscriptCaptions = (transcriptItems: LiveTranscriptItem[]) => {
  if (!transcriptItems.length) {
    return [];
  }

  // No sorting - rely on insertion order like dashboard-ff
  const merged: GroupedCaption[] = [];

  let currentSpeaker = "";
  let lastCaptionEndTime = 0;
  let currentGroup: GroupedCaption | null = null;

  for (const item of transcriptItems) {
    if (!item.sentence.length) continue;

    const isUnassigned = isUnassignedSpeaker(
      item.speaker_name,
      item.speaker_id,
    );
    const speakerName = isUnassigned
      ? UNASSIGNED_SPEAKER_LABEL
      : (item.speaker_name ?? "Speaker");
    const speakerId = isUnassigned
      ? UNASSIGNED_SPEAKER_KEY
      : String(item.speaker_id ?? "");
    const baseIndex = parseInt(item.transcript_id, 10);
    const startTime = Math.floor(item.time);
    const endTime = Math.floor(item.endTime);

    const caption: Caption = {
      index: baseIndex,
      startTime,
      endTime,
      text: item.sentence.trim(),
      speakerId,
      speakerName,
    };

    const timeDiff = Math.floor(caption.startTime - lastCaptionEndTime);
    const isNewSpeaker = currentSpeaker !== caption.speakerName;
    const isTimeGap = lastCaptionEndTime > 0 && timeDiff > MERGE_TIME_THRESHOLD;

    const isParagraphBreak =
      !isUnassigned &&
      currentGroup &&
      (currentGroup.text.endsWith(".") || currentGroup.text.endsWith("?")) &&
      currentGroup.text.length > PARAGRAPH_BREAK_THRESHOLD;

    if (
      !currentGroup ||
      isNewSpeaker ||
      isTimeGap ||
      isParagraphBreak ||
      isUnassigned
    ) {
      // Use the first caption index as a stable group identifier to keep keys consistent across updates
      currentGroup = {
        index: caption.index,
        speakerId: caption.speakerId,
        speakerName: caption.speakerName,
        text: caption.text,
        startTime: caption.startTime,
        endTime: caption.endTime,
        captions: [caption],
      };
      merged.push(currentGroup);
    } else {
      currentGroup.captions.push(caption);
      currentGroup.text += ` ${caption.text}`;
      currentGroup.endTime = caption.endTime;
    }

    currentSpeaker = caption.speakerName;
    lastCaptionEndTime = caption.endTime;
  }

  return merged;
};

export const useLiveTranscript = ({
  meetingId,
  realtimeToken,
}: {
  meetingId: string;
  realtimeToken: string | null;
}) => {
  const transcriptMapRef = useRef<Map<string, LiveTranscriptItem>>(new Map());
  const interactionRef = useRef<{ cancel: () => void } | null>(null);
  const hasReceivedRealtimeTranscriptRef = useRef(false);
  const lastRealtimeTranscriptTimeRef = useRef<number>(Date.now());

  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [groupedCaptions, setGroupedCaptions] = useState<GroupedCaption[]>([]);

  const { data, loading, refetch } = useGetLiveTranscriptQuery({
    variables: {
      meetingId,
      realtimeToken: realtimeToken as string,
    },
    skip: !realtimeToken,
    onError(error) {
      toast({
        title: "Failed to get live transcript",
        message: error.message,
        type: "error",
      });
    },
    fetchPolicy: "cache-and-network",
  });

  const processUpdatedCaptions = useCallback(
    ({ partialUpdate }: { partialUpdate: boolean }) => {
      interactionRef.current?.cancel();

      const processUpdate = () => {
        // Use Array.from to preserve order from Map
        const rawCaptions = Array.from(transcriptMapRef.current.values());
        if (!rawCaptions.length) {
          setGroupedCaptions([]);
          return;
        }

        const merged = mergeTranscriptCaptions(rawCaptions);

        if (partialUpdate) {
          // For partial updates, preserve references for unchanged groups
          setGroupedCaptions((prev) => {
            if (
              prev.length <= FLASHLIST_RENDER_THRESHOLD ||
              merged.length <= FLASHLIST_RENDER_THRESHOLD
            ) {
              return merged;
            }

            const keepCount = merged.length - FLASHLIST_RENDER_THRESHOLD;
            const head = prev.slice(0, keepCount); // unchanged references
            const tail = merged.slice(keepCount); // new references for the latest items

            return [...head, ...tail];
          });
        } else {
          setGroupedCaptions(merged);
        }
      };

      // For live updates, process immediately without waiting for interactions
      if (partialUpdate) {
        processUpdate();
      } else {
        // For initial load, defer to avoid blocking
        interactionRef.current =
          InteractionManager.runAfterInteractions(processUpdate);
      }
    },
    [],
  );

  useEffect(() => () => interactionRef.current?.cancel(), []);

  useEffect(() => {
    transcriptMapRef.current = new Map();
    setGroupedCaptions([]);
    hasReceivedRealtimeTranscriptRef.current = false;
    lastRealtimeTranscriptTimeRef.current = Date.now();
  }, [meetingId]);

  useEffect(() => {
    if (data?.getLiveTranscript?.length) {
      // Skip if we already have more captions from realtime sources
      // (socket or electron streaming can be ahead of the GraphQL snapshot)
      if (transcriptMapRef.current.size >= data.getLiveTranscript.length) {
        return;
      }

      // Create a new Map from the transcript data
      const newMap = new Map<string, LiveTranscriptItem>();

      data.getLiveTranscript.forEach((caption) => {
        if (caption?.transcript_id) {
          newMap.set(caption.transcript_id, {
            ...caption,
            text: caption.text ?? caption.sentence,
            sentence: caption.sentence,
            __typename: "LiveTranscriptItem",
          });
        }
      });

      transcriptMapRef.current = newMap;
      processUpdatedCaptions({ partialUpdate: false });
    }
  }, [data?.getLiveTranscript, processUpdatedCaptions]);

  const processScheduledUpdate = useCallback(() => {
    timeoutRef.current = null;
    if (!pendingUpdatesRef.current) return;
    pendingUpdatesRef.current = false;
    lastUpdateTimeRef.current = Date.now();
    processUpdatedCaptions({ partialUpdate: true });
  }, [processUpdatedCaptions]);

  const updateTranscriptCache = useCallback(
    (newCaption: LiveTranscriptItem) => {
      // Similar to dashboard-ff, check if this caption is newer than last one
      const lastValue = Array.from(transcriptMapRef.current.values()).pop();
      const isUnassigned = isUnassignedSpeaker(
        newCaption.speaker_name,
        newCaption.speaker_id,
      );
      const newText = newCaption.text ?? newCaption.sentence;

      const commitUpdate = () => {
        transcriptMapRef.current.set(newCaption.transcript_id, {
          ...newCaption,
          text: newText,
          sentence: newCaption.sentence,
          __typename: "LiveTranscriptItem",
        });

        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

        if (timeSinceLastUpdate < UPDATE_THROTTLE_MS) {
          pendingUpdatesRef.current = true;

          if (!timeoutRef.current) {
            // Use minimal delay for real-time feel
            const delay = Math.max(
              16,
              UPDATE_THROTTLE_MS - timeSinceLastUpdate,
            );
            timeoutRef.current = setTimeout(processScheduledUpdate, delay);
          }
        } else {
          lastUpdateTimeRef.current = now;
          pendingUpdatesRef.current = false;

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          processUpdatedCaptions({ partialUpdate: true });
        }
      };

      const isNewerThanLast =
        !lastValue || newCaption.endTime >= (lastValue.endTime || 0);
      const isStrictlyNewerThanLast =
        !lastValue || newCaption.endTime > (lastValue.endTime || 0);

      if (!isUnassigned) {
        if (isStrictlyNewerThanLast) {
          commitUpdate();
        }
        return;
      }

      const existing = transcriptMapRef.current.get(newCaption.transcript_id);
      const newSentence = newCaption.sentence ?? "";
      const existingSentence = existing?.sentence ?? "";
      const isSameEndTime =
        !!existing && newCaption.endTime === existing.endTime;
      const hasSentenceLengthChange =
        isSameEndTime && existingSentence.length !== newSentence.length;
      const hasSentenceContentChange =
        isSameEndTime &&
        (hasSentenceLengthChange ||
          (existingSentence.length === newSentence.length &&
            existingSentence !== newSentence));
      const shouldAcceptNew = !existing && isNewerThanLast;
      const shouldUpdateExisting =
        !!existing &&
        (newCaption.endTime > existing.endTime || hasSentenceContentChange);

      if (shouldAcceptNew || shouldUpdateExisting) {
        commitUpdate();
      }
    },
    [processScheduledUpdate, processUpdatedCaptions],
  );

  const ingestTranscript = useCallback(
    (newCaption: LiveTranscriptItem) => {
      lastRealtimeTranscriptTimeRef.current = Date.now();
      const isFirstTranscript = !hasReceivedRealtimeTranscriptRef.current;
      hasReceivedRealtimeTranscriptRef.current = true;

      if (isFirstTranscript && realtimeToken) {
        void refetch();
      }

      updateTranscriptCache(newCaption);
    },
    [realtimeToken, refetch, updateTranscriptCache],
  );

  const ingestElectronTranscript = useCallback(
    (payload: unknown): boolean => {
      const liveTranscriptItem = toLiveTranscriptItemFromElectron(payload);
      if (!liveTranscriptItem) return false;
      ingestTranscript(liveTranscriptItem);
      return true;
    },
    [ingestTranscript],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    liveTranscript: {
      groupedCaptions,
      loading,
      hasTranscript:
        groupedCaptions.length > 0 ||
        (data?.getLiveTranscript?.length ?? 0) > 0,
    },
    updateTranscriptCache,
    ingestTranscript,
    ingestElectronTranscript,
    lastRealtimeTranscriptTimeRef,
    refetch,
  };
};
