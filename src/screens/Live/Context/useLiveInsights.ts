import { toast } from "@/components/Toast";
import type {
  GetLiveMeetingInsightsQuery,
  LiveActionItem,
  LiveInsights,
  LiveNote,
  Meeting,
} from "@/graphql";
import {
  GetLiveMeetingInsightsDocument,
  useGetLiveMeetingInsightsQuery,
} from "@/graphql";
import { partialUpsertDataArray } from "@/utils/array";
import { toHHMMSS } from "@/utils/time";
import { useApolloClient } from "@apollo/client";
import { useCallback, useMemo } from "react";

export type ChapterizedNotes = Record<string, Array<LiveNote>> | null;
export interface FormattedChapter {
  title: string;
  emoji: string;
  notes: LiveNote[];
  timeRangeFormatted: string;
}

export const useLiveInsights = ({
  meeting,
  realtimeToken,
}: {
  meeting: Meeting;
  realtimeToken: string | null;
}) => {
  const apolloClient = useApolloClient();

  const {
    data: liveMeetingInsightsData,
    loading: loadingLiveInsights,
    refetch: refetchLiveInsights,
  } = useGetLiveMeetingInsightsQuery({
    skip: !realtimeToken,
    variables: {
      meetingId: meeting.id,
      realtimeToken: realtimeToken as string,
    },
    onError(error) {
      toast({
        title: "Failed to get live meeting insights",
        message: error.message,
        type: "error",
      });
    },
    fetchPolicy: "cache-and-network",
  });

  const liveInsights =
    liveMeetingInsightsData?.getLiveMeetingInsights as LiveInsights;

  const chapterizedNotes = liveInsights?.chapterizedNotes as ChapterizedNotes;

  const formattedChapters = useMemo<FormattedChapter[]>(() => {
    if (!chapterizedNotes) return [];

    return Object.entries(chapterizedNotes)
      .map(([title, notes]) => {
        if (!notes || !notes.length) return null;

        const sortedNotes = [...notes].sort((a, b) => {
          return a.time - b.time;
        });

        const startTime = sortedNotes[0].time;
        const endTime = sortedNotes[sortedNotes.length - 1].endTime;

        return {
          title,
          emoji: sortedNotes[0].emoji ?? "💬",
          notes: sortedNotes,
          timeRangeFormatted:
            sortedNotes.length === 1
              ? `(${toHHMMSS(startTime)})`
              : `(${toHHMMSS(startTime)}${
                  endTime && endTime !== startTime
                    ? ` - ${toHHMMSS(endTime)}`
                    : ""
                })`,
        };
      })
      .filter(Boolean) as FormattedChapter[];
  }, [chapterizedNotes]);

  const updateSingleNote = useCallback(
    (note: LiveNote) => {
      if (!note || !note.id || !note.note) return;

      apolloClient.cache.updateQuery<GetLiveMeetingInsightsQuery>(
        {
          query: GetLiveMeetingInsightsDocument,
          variables: {
            meetingId: meeting.id,
            realtimeToken: realtimeToken as string,
          },
        },
        (data) => {
          if (!data?.getLiveMeetingInsights) return data;

          const existingLiveInsights = data.getLiveMeetingInsights;
          let notes = existingLiveInsights.notes?.filter(Boolean) ?? [];

          let chapterizedNotes = (existingLiveInsights.chapterizedNotes ??
            {}) satisfies ChapterizedNotes;

          const typedNote = {
            ...note,
            __typename: "LiveNote",
          } satisfies LiveNote;

          const noteIndex = notes.findIndex((n) => n.id === note.id);
          if (noteIndex >= 0) {
            notes = [
              ...notes.slice(0, noteIndex),
              typedNote,
              ...notes.slice(noteIndex + 1),
            ] satisfies (LiveNote | null)[];
          } else {
            notes = [...notes, typedNote] satisfies (LiveNote | null)[];
          }

          const title = note.title ?? "Untitled";
          const existingChapter = chapterizedNotes[title] ?? [];

          chapterizedNotes = {
            ...chapterizedNotes,
            [title]: partialUpsertDataArray(existingChapter, typedNote, "id"),
          };

          return {
            getLiveMeetingInsights: {
              __typename: "LiveInsights",
              actionItems: existingLiveInsights.actionItems ?? [],
              notes,
              chapterizedNotes,
            },
          };
        },
      );
    },
    [meeting.id, apolloClient, realtimeToken],
  );

  const handleChaptersUpdate = useCallback(
    (updatedChapters: ChapterizedNotes) => {
      if (!updatedChapters) return;

      apolloClient.cache.updateQuery<GetLiveMeetingInsightsQuery>(
        {
          query: GetLiveMeetingInsightsDocument,
          variables: {
            meetingId: meeting.id,
            realtimeToken: realtimeToken as string,
          },
        },
        (data) => {
          if (!data?.getLiveMeetingInsights) return data;

          const existingLiveInsights = data.getLiveMeetingInsights;
          let allNotes: LiveNote[] = [];
          const typedChapters: ChapterizedNotes = {};

          Object.entries(updatedChapters).forEach(([title, chapterNotes]) => {
            const validChapterNotes = chapterNotes
              .filter((note) => !!note && !!note.id && !!note.note)
              .map(
                (note) =>
                  ({
                    ...note,
                    title: note.title ?? title,
                    __typename: "LiveNote",
                  }) satisfies LiveNote,
              );

            typedChapters[title] = validChapterNotes;
            allNotes = [...allNotes, ...validChapterNotes];
          });

          return {
            getLiveMeetingInsights: {
              __typename: "LiveInsights",
              actionItems: existingLiveInsights.actionItems,
              notes: allNotes satisfies (LiveNote | null)[],
              chapterizedNotes: typedChapters,
            },
          };
        },
      );
    },
    [meeting.id, apolloClient, realtimeToken],
  );

  const updateActionItems = useCallback(
    (actionItems: LiveActionItem[]) => {
      apolloClient.cache.updateQuery<GetLiveMeetingInsightsQuery>(
        {
          query: GetLiveMeetingInsightsDocument,
          variables: {
            meetingId: meeting.id,
            realtimeToken: realtimeToken as string,
          },
        },
        (data) => {
          if (!data?.getLiveMeetingInsights) return data;

          const existingLiveInsights = data.getLiveMeetingInsights;
          let existingActionItems =
            existingLiveInsights.actionItems?.filter(Boolean) ?? [];

          actionItems.forEach((item) => {
            if (!item || !item.id) return;

            const typedItem = {
              ...item,
              __typename: "LiveActionItem",
            } satisfies LiveActionItem;

            existingActionItems = partialUpsertDataArray(
              existingActionItems,
              typedItem,
              "id",
            );
          });

          return {
            getLiveMeetingInsights: {
              __typename: "LiveInsights",
              actionItems:
                existingActionItems satisfies (LiveActionItem | null)[],
              notes: existingLiveInsights.notes,
              chapterizedNotes: existingLiveInsights.chapterizedNotes,
            },
          };
        },
      );
    },
    [meeting.id, apolloClient, realtimeToken],
  );

  const upsertLiveInsightsCache = useCallback(
    ({
      actionItems,
      notes,
      chapters,
    }: {
      actionItems?: LiveActionItem[];
      notes?: LiveNote[];
      chapters?: ChapterizedNotes;
    }) => {
      if (chapters) {
        handleChaptersUpdate(chapters);
        return;
      }

      notes?.forEach((note) => {
        if (note.id) {
          updateSingleNote(note);
        }
      });

      if (actionItems?.length) {
        updateActionItems(actionItems);
      }
    },
    [handleChaptersUpdate, updateSingleNote, updateActionItems],
  );

  return {
    liveInsights,
    loadingLiveInsights,
    upsertLiveInsightsCache,
    handleChaptersUpdate,
    refetchLiveInsights,
    formattedChapters,
  };
};
