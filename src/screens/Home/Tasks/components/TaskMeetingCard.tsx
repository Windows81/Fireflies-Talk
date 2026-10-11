import { IconPlus } from "@/assets/svg";
import { AnimatedChevron } from "@/components/Animated";
import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { type CoreFeedMeetingFieldsFragment } from "@firefliesai/tasks-ff.graphql-client";
import { memo, useCallback, useContext, useMemo, type FC } from "react";
import { Pressable, View } from "react-native";
import {
  LoadingMeetingHeader,
  MeetingHeader,
} from "../../components/MeetingHeader";
import { meetingCardStyles } from "../../components/styles";
import { TasksContext } from "../TasksContext";
import { CreateTaskModal } from "./CreateTaskModal";
import { ListTaskItem, LoadingListTaskItem } from "./ListTaskItem/ListTaskItem";

export const TaskMeetingCard = memo<{
  meeting: CoreFeedMeetingFieldsFragment;
  isExpanded: boolean;
  onToggle: (meetingId: string) => void;
}>(function TaskMeetingCard({ meeting, isExpanded, onToggle }) {
  const theme = useTheme();

  const [isOpenCreate, openCreate, closeCreate] = useBooleanState();

  const toggleExpanded = useCallback(
    () => onToggle(meeting._id),
    [onToggle, meeting._id],
  );

  const { onlyMine, filterMyTasks, sortTasks } = useContext(TasksContext);
  const tasks = useMemo(() => {
    if (onlyMine) {
      return meeting.tasks.filter(filterMyTasks).sort(sortTasks);
    }
    return Array.from(meeting.tasks).sort(sortTasks);
  }, [filterMyTasks, onlyMine, meeting.tasks, sortTasks]);

  if (onlyMine && !tasks.length) return null;

  return (
    <>
      <View style={[meetingCardStyles.root, styles.root]}>
        <View style={styles.header}>
          <LinkView
            href={{
              pathname: "Notepad",
              params: { id: meeting._id, ref: "tasks" },
            }}
            animated
            style={styles.headerLink}
          >
            <MeetingHeader meeting={meeting} />
          </LinkView>
          <Pressable
            onPress={toggleExpanded}
            hitSlop={12}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={`Tasks of ${meeting.title}`}
            accessibilityState={{ expanded: isExpanded }}
            accessibilityHint={
              isExpanded
                ? "Collapses the tasks of this meeting"
                : "Expands the tasks of this meeting"
            }
          >
            <AnimatedChevron expanded={isExpanded} />
          </Pressable>
        </View>
        {isExpanded && (
          <View
            style={[meetingCardStyles.content(theme), styles.content(theme)]}
          >
            {tasks.map((task) => (
              <ListTaskItem key={task.id} meeting={meeting} task={task} />
            ))}
            <View style={styles.buttonContainer(theme)}>
              <Button
                Icon={IconPlus}
                variant="transparentNeutral"
                onPress={openCreate}
                style={styles.newButton}
              >
                New
              </Button>
            </View>
          </View>
        )}
      </View>
      <CreateTaskModal
        meeting={meeting}
        isOpen={isOpenCreate}
        close={closeCreate}
      />
    </>
  );
});

export const LoadingTaskMeetingCard: FC = () => {
  const theme = useTheme();
  return (
    <View style={[meetingCardStyles.root, styles.root]}>
      <View style={styles.horPadding}>
        <LoadingMeetingHeader />
      </View>
      <View style={[meetingCardStyles.content(theme), styles.content(theme)]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingListTaskItem key={index} />
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    paddingVertical: 16,
  },
  content: (theme) => ({
    gap: 4,
    paddingRight: theme.breakpoint === Breakpoint.Small ? 0 : 16,
  }),
  horPadding: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLink: {
    flex: 1,
  },
  toggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  newButton: {
    alignSelf: "flex-start",
  },
  buttonContainer: (theme) => ({
    borderRadius: 8,
    backgroundColor: theme.colors.layerSubtle,
  }),
});
