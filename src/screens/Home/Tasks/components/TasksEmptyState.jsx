import { EmptyState } from "../../components/EmptyState";

export const TasksEmptyState = () => {
  return (
    <EmptyState
      title="All your meeting tasks in one place"
      description="Manage, assign and update all your meeting tasks here."
      openAddModalFromRef="home/tasks-empty"
    />
  );
};
