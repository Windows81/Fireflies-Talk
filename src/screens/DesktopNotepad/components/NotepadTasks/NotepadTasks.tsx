import { MeetingSummaryStatus, useFetchSummaryStatusQuery } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { Platform, ScrollView, View } from "react-native";
import { SUMMARY_STALL_MS } from "../../constants";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { getTranscriptStatus } from "../../helpers/transcriptStatus";
import { useDeferredTaskCompletion } from "../../hooks/useDeferredTaskCompletion";
import { useSummaryStallTimeout } from "../../hooks/useSummaryStallTimeout";
import { useSyncedPaneScroll } from "../../hooks/useSyncedPaneScroll";
import { useNotepadTasksContext } from "../../NotepadTasksProvider";
import { FreeMeetingsPaywallPane } from "../FreeMeetingsPaywall/FreeMeetingsPaywallPane";
import {
  isAwaitingTranscript,
  useFreeMeetingsPaywall,
} from "../FreeMeetingsPaywall/useFreeMeetingsPaywall";
import { NotepadMeetingHeader } from "../NotepadMeetingHeader";
import { NotepadAddTaskRow } from "./NotepadAddTaskRow";
import { NotepadTaskRow } from "./NotepadTaskRow";
import { NotepadTasksFilterHeader } from "./NotepadTasksFilterHeader";
import { NotepadTasksSkeleton } from "./NotepadTasksSkeleton";

export const NotepadTasks = () => {
  const theme = useTheme();
  const { meeting, mainTab } = useDesktopNotepadContext();
  const { scrollRef, onScroll } = useSyncedPaneScroll(mainTab === "tasks");
  const {
    pending,
    completed,
    totalCount,
    counts,
    filter,
    setFilter,
    participants,
    canEditTask,
    toggleTask,
    createTask,
    assignTask,
    editTask,
    loading,
  } = useNotepadTasksContext();

  const {
    data: statusData,
    loading: statusLoading,
    error: statusError,
  } = useFetchSummaryStatusQuery({
    variables: { meetingId: meeting.id },
  });
  const summaryStatus = statusData?.fetchSummaryStatus;

  const { handleToggle, isCompleting } = useDeferredTaskCompletion(toggleTask);

  const { isOutOfFreeMeetings, showUpgrade } = useFreeMeetingsPaywall();
  // Tasks that were generated before the quota ran out still belong to the
  // user, so the card waits for the query rather than flashing over them.
  const isTasksPaywalled =
    mainTab === "tasks" &&
    isOutOfFreeMeetings &&
    !loading &&
    totalCount === 0 &&
    isAwaitingTranscript(getTranscriptStatus(meeting));

  // Tasks are generated with the summary — keep the skeleton while status is
  // unknown/processing, or while the tasks query itself is still loading.
  // If the status query errors out, fall through to the task UI.
  const isSummarySettled =
    summaryStatus === MeetingSummaryStatus.Processed ||
    summaryStatus === MeetingSummaryStatus.Failed ||
    summaryStatus === MeetingSummaryStatus.Skipped;
  const stalled = useSummaryStallTimeout(!isSummarySettled, SUMMARY_STALL_MS);
  const showSkeleton =
    loading ||
    (statusLoading && !statusData) ||
    (!isSummarySettled && !statusError && !stalled);

  return (
    <ScrollView
      ref={scrollRef}
      nativeID="notepad-pane-scroll"
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <NotepadMeetingHeader />
      {isTasksPaywalled ? (
        <FreeMeetingsPaywallPane surface="tasks" showUpgrade={showUpgrade} />
      ) : showSkeleton ? (
        <View style={styles.body}>
          <NotepadTasksSkeleton />
        </View>
      ) : (
        <View style={styles.body}>
          {totalCount > 0 && (
            <NotepadTasksFilterHeader
              filter={filter}
              setFilter={setFilter}
              counts={counts}
              completed={completed.length}
            />
          )}
          <View style={styles.list}>
            {pending.map((task) => (
              <NotepadTaskRow
                key={task.id}
                task={task}
                completed={isCompleting(task.id)}
                participants={participants}
                canEdit={canEditTask(task)}
                onToggle={(next) => handleToggle(task, false, next)}
                onAssign={(owner) => assignTask(task, owner)}
                onEditTitle={(title) => editTask(task, title)}
              />
            ))}
            <NotepadAddTaskRow onCreate={createTask} />
          </View>
          {completed.length > 0 && (
            <>
              <View style={styles.divider(theme)} />
              <View style={styles.list}>
                {completed.map((task) => (
                  <NotepadTaskRow
                    key={task.id}
                    task={task}
                    completed
                    participants={participants}
                    canEdit={canEditTask(task)}
                    onToggle={(next) => handleToggle(task, true, next)}
                    onAssign={(owner) => assignTask(task, owner)}
                    onEditTitle={(title) => editTask(task, title)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = createStyles({
  scroll: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    ...(Platform.OS === "web" && { overflowX: "hidden" as const }),
  },
  content: {
    gap: 48,
    paddingTop: 16,
    paddingBottom: 96,
    minWidth: 0,
  },
  body: {
    gap: 8,
  },
  list: {
    minWidth: 0,
  },
  divider: (theme) => ({
    height: 1,
    backgroundColor: theme.colors.borderStaticSubtle,
  }),
});
