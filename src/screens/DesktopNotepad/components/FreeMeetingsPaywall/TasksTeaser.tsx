import { IconChevronDown } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { NotepadTaskAssignee } from "../NotepadTasks/NotepadTaskAssignee";
import { TaskCheckboxBox } from "../NotepadTasks/TaskCheckboxBox";
import { TaskProgressRing } from "../NotepadTasks/TaskProgressRing";
import { taskRowStyles } from "../NotepadTasks/taskRowStyles";
import { PaywallTeaser } from "./PaywallTeaser";

const TASKS: { title: string; assignee?: string }[] = [
  {
    title: "Share updated product roadmap with stakeholders by EOD.",
    assignee: "Andrew",
  },
  {
    title: "Align on launch plan for new onboarding flow.",
    assignee: "Andrew",
  },
  { title: "Finalize scope for next sprint's feature set.", assignee: "Keith" },
  {
    title: "Create ticket for mobile UI refinements based on QA feedback.",
    assignee: "Keith",
  },
  {
    title: "Compile team highlights and wins for internal newsletter.",
    assignee: "Jane",
  },
  { title: "Post recording to company wiki." },
  { title: "Create poll for next month's agenda topics." },
];

const TeaserRow: FC<{ title: string; assignee?: string; muted?: boolean }> = ({
  title,
  assignee,
  muted = false,
}) => (
  <View style={taskRowStyles.row}>
    <View style={taskRowStyles.leading}>
      <View style={taskRowStyles.checkboxWrap}>
        <TaskCheckboxBox disabled={muted} />
      </View>
      <Text
        variant="body1LongRegular"
        color={muted ? "textHint" : "commandNeutralDefault"}
        style={styles.title}
      >
        {title}
      </Text>
    </View>
    {assignee && (
      <View style={taskRowStyles.actions}>
        <NotepadTaskAssignee label={assignee} />
      </View>
    )}
  </View>
);

/** Echoes the tasks pane — filter header, rows, add-task row — as decoration. */
export const TasksTeaser: FC = () => {
  const theme = useTheme();

  return (
    <PaywallTeaser gap={8}>
      <View style={styles.header}>
        <TaskProgressRing completed={0} total={TASKS.length} />
        <View style={styles.filter}>
          <Text variant="body1Regular" color="commandNeutralDefault">
            All Tasks ({TASKS.length})
          </Text>
          <IconChevronDown
            width={16}
            height={16}
            color={theme.colors.commandNeutralDefault}
          />
        </View>
      </View>
      <View>
        {TASKS.map((task) => (
          <TeaserRow key={task.title} {...task} />
        ))}
        <TeaserRow title="Add Task" muted />
      </View>
    </PaywallTeaser>
  );
};

const styles = createStyles({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  title: {
    flex: 1,
  },
});
