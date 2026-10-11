import { toast } from "@/components/Toast";
import type {
  CreateMarkMutationVariables,
  GetLiveMeetingMarksQuery,
  GetLiveMeetingMarksQueryVariables,
  Meeting,
  MeetingNoteCommentsQuery,
  MeetingNoteCommentsQueryVariables,
  NewMeetingNoteCommentMutationVariables,
} from "@/graphql";
import {
  GetLiveMeetingMarksDocument,
  MeetingNoteCommentsDocument,
  useCreateMarkMutation,
  useDeleteMarkMutation,
  useDeleteMeetingNoteCommentMutation,
  useGetLiveMeetingMarksQuery,
  useMeetingNoteCommentsQuery,
  useNewMeetingNoteCommentMutation,
} from "@/graphql";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { partialUpsertDataArray } from "@/utils/array";
import { toHHMMSS } from "@/utils/time";
import { useApolloClient } from "@apollo/client";
import { useCallback, useMemo } from "react";
import { getLiveActivityTimestamp } from "../Bookmarks/utils";
import type {
  DeleteLiveMeetingActivityEvent,
  LiveMeetingActivity,
} from "@/features/live";

export const useLiveActivities = ({ meeting }: { meeting: Meeting }) => {
  const { data: dataLiveMeetingMarks, refetch: refetchLiveMeetingMarks } =
    useGetLiveMeetingMarksQuery({
      variables: {
        meetingId: meeting.id,
      },
      fetchPolicy: "cache-and-network",
    });

  const { data: dataMeetingNoteComments, refetch: refetchMeetingNoteComments } =
    useMeetingNoteCommentsQuery({
      variables: {
        meetingId: meeting.id,
      },
      fetchPolicy: "cache-and-network",
    });

  const liveActivities = useMemo<LiveMeetingActivity[]>(() => {
    return [
      ...(dataLiveMeetingMarks?.getLiveMeetingMarks || []),
      ...(dataMeetingNoteComments?.meetingNoteComments || []),
    ]
      .sort((a, b) => {
        if (!a || !b) {
          return 0;
        }
        return getLiveActivityTimestamp(a) - getLiveActivityTimestamp(b);
      })
      .filter((activity) => !!activity);
  }, [dataLiveMeetingMarks, dataMeetingNoteComments]);

  const refetchLiveActivities = useCallback(() => {
    return Promise.all([
      refetchLiveMeetingMarks(),
      refetchMeetingNoteComments(),
    ]);
  }, [refetchLiveMeetingMarks, refetchMeetingNoteComments]);

  const apolloClient = useApolloClient();

  const upsertLiveActivitiesCache = useCallback(
    (activity: LiveMeetingActivity) => {
      if ("markPinType" in activity) {
        apolloClient.cache.updateQuery<
          GetLiveMeetingMarksQuery,
          GetLiveMeetingMarksQueryVariables
        >(
          {
            query: GetLiveMeetingMarksDocument,
            variables: {
              meetingId: meeting.id,
            },
          },
          (data) => {
            return {
              getLiveMeetingMarks: partialUpsertDataArray(
                data?.getLiveMeetingMarks || [],
                {
                  // apollo client throw errors on missing fields
                  // so we fallback filling all fields with undefined
                  createdAt: null,
                  futureOffsetSeconds: null,
                  markPinType: null,
                  markType: null,
                  meetingId: null,
                  meetingOwnerId: null,
                  time: null,
                  pastOffsetSeconds: null,
                  source: null,
                  userId: null,
                  summary: null,
                  transcriptParseId: null,
                  userFirstName: null,
                  userPicture: null,
                  ...activity,
                  __typename: "WaveMark",
                },
                "_id",
              ),
            };
          },
        );
      } else if ("comment" in activity) {
        apolloClient.cache.updateQuery<
          MeetingNoteCommentsQuery,
          MeetingNoteCommentsQueryVariables
        >(
          {
            query: MeetingNoteCommentsDocument,
            variables: {
              meetingId: meeting.id,
            },
          },
          (data) => {
            return {
              meetingNoteComments: partialUpsertDataArray(
                data?.meetingNoteComments?.filter((comment) => !!comment) || [],
                {
                  // apollo client throw errors on missing fields
                  // so we fallback filling all fields with undefined
                  picture: null,
                  createdAt: null,
                  creatorProfile: null,
                  isBookmarked: null,
                  isPrivate: null,
                  meetingId: null,
                  comment: null,
                  name: null,
                  privacy: null,
                  replyToCommentId: null,
                  source: null,
                  timestamp: null,
                  userId: null,
                  ...activity,
                  __typename: "MeetingNoteComment",
                },
                "_id",
              ),
            };
          },
        );
      }
    },
    [meeting.id, apolloClient],
  );

  const deleteLiveActivityCache = useCallback(
    (activity: DeleteLiveMeetingActivityEvent) => {
      // realtime-ff only provides the _id and meetingId and
      // we don't even know if it's a mark or a comment
      // so we try to remove it from both caches
      apolloClient.cache.updateQuery<
        GetLiveMeetingMarksQuery,
        GetLiveMeetingMarksQueryVariables
      >(
        {
          query: GetLiveMeetingMarksDocument,
          variables: {
            meetingId: meeting.id,
          },
        },
        (data) => {
          return {
            getLiveMeetingMarks:
              data?.getLiveMeetingMarks?.filter(
                (mark) => mark._id !== activity._id,
              ) || [],
          };
        },
      );
      apolloClient.cache.updateQuery<
        MeetingNoteCommentsQuery,
        MeetingNoteCommentsQueryVariables
      >(
        {
          query: MeetingNoteCommentsDocument,
          variables: {
            meetingId: meeting.id,
          },
        },
        (data) => {
          return {
            meetingNoteComments:
              data?.meetingNoteComments?.filter(
                (comment) => comment?._id !== activity._id,
              ) || [],
          };
        },
      );
    },
    [meeting.id, apolloClient],
  );

  const [createMarkMutate] = useCreateMarkMutation({
    onCompleted(res) {
      const marker = res?.createMark;
      if (!marker) {
        return;
      }

      upsertLiveActivitiesCache(marker);

      tracker.track(TRACKING_EVENTS.REALTIME_USER_ACTION, {
        action: `${marker.markType}-${marker.markPinType}`,
        id: marker._id,
        meetingId: marker.meetingId,
        duration: toHHMMSS(marker.time || 0),
      });
    },
    onError(err) {
      toast({
        title: "Could not create bookmark",
        message: err.message,
      });
    },
  });

  const createMark = useCallback(
    async (input: CreateMarkMutationVariables) => {
      return createMarkMutate({
        variables: input,
      });
    },
    [createMarkMutate],
  );

  const [newMeetingNoteCommentMutate] = useNewMeetingNoteCommentMutation({
    onCompleted(res) {
      const comment = res?.newMeetingNoteComment;
      if (!comment) {
        return;
      }

      upsertLiveActivitiesCache(comment);

      tracker.track(TRACKING_EVENTS.REALTIME_USER_ACTION, {
        action: "comment",
        id: comment._id,
        meetingId: comment.meetingId,
        duration: toHHMMSS(comment.timestamp || 0),
      });
    },
    onError(err) {
      toast({
        title: "Could not create note",
        message: err.message,
      });
    },
  });

  const createComment = useCallback(
    (input: NewMeetingNoteCommentMutationVariables) => {
      return newMeetingNoteCommentMutate({
        variables: input,
      });
    },
    [newMeetingNoteCommentMutate],
  );

  const [deleteMeetingNoteComment] = useDeleteMeetingNoteCommentMutation({
    onCompleted() {
      toast({
        type: "success",
        message: "Comment deleted",
      });
    },
    onError(err) {
      toast({
        title: "Could not delete comment",
        message: err.message,
      });
    },
  });

  const [deleteMark] = useDeleteMarkMutation({
    onCompleted() {
      toast({
        type: "success",
        message: "Bookmark deleted",
      });
    },
    onError(err) {
      toast({
        title: "Could not delete bookmark",
        message: err.message,
      });
    },
  });

  const deleteActivity = useCallback(
    async (activity: LiveMeetingActivity) => {
      if ("comment" in activity) {
        await deleteMeetingNoteComment({
          variables: {
            commentId: activity._id,
          },
        });
      } else if ("markPinType" in activity) {
        if (!activity._id || !activity.meetingId) {
          return;
        }
        await deleteMark({
          variables: {
            markId: activity._id,
            meetingId: activity.meetingId,
          },
        });
      }
      deleteLiveActivityCache(activity);
    },
    [deleteMeetingNoteComment, deleteMark, deleteLiveActivityCache],
  );

  return {
    liveActivities,
    refetchLiveActivities,
    upsertLiveActivitiesCache,
    deleteLiveActivityCache,
    createMark,
    createComment,
    deleteActivity,
  };
};
