import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { RefreshControl } from "@/components/RefreshControl";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import { EnumTaskOwnerType, useFetchMore } from "@/graphql";
import { useAiAppViewedTracking } from "@/screens/PersonalAssistant/helpers/useAiAppViewedTracking";
import { useSortTasks } from "@/screens/PersonalAssistant/helpers/useSortTasks";
import { createStyles, useTheme, vars } from "@/styles";
import { useQuery } from "@apollo/client";
import type {
  CoreFeedMeetingFieldsFragment,
  CoreTaskFieldsFragment,
} from "@firefliesai/tasks-ff.graphql-client";
import { GetFeedTasksDocument } from "@firefliesai/tasks-ff.graphql-client";
import type { RouteProp } from "@react-navigation/native";
import {
  useNavigation,
  useRoute,
  useScrollToTop,
} from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState, type FC } from "react";
import type { FlatList, ListRenderItem } from "react-native";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import type { ParamList } from "src/screens/types";
import { TasksContext } from "./TasksContext";
import {
  LoadingTaskMeetingCard,
  TaskMeetingCard,
} from "./components/TaskMeetingCard";
import { TasksEmptyState } from "./components/TasksEmptyState";

enum TaskTab {
  ALL_TASKS = "all",
  MY_TASKS = "mine",
}

const LIMIT = 20;

const loadingTaskMeetingCards = (
  <View>
    {Array.from({ length: 3 }).map((_, index) => (
      <LoadingTaskMeetingCard key={index} />
    ))}
  </View>
);

const itemLayoutAnimation = LinearTransition.duration(250);

const TASK_TABS = [
  { value: TaskTab.MY_TASKS, label: "My Tasks" },
  { value: TaskTab.ALL_TASKS, label: "All Tasks" },
];

export const Tasks: FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { userGroups } = useTeam();
  const { sortTasks } = useSortTasks();
  useAiAppViewedTracking({ appTitle: "Tasks" });

  const userGroupIds = useMemo(
    () => userGroups?.map((group) => group._id) || [],
    [userGroups],
  );

  const { params } = useRoute<RouteProp<ParamList, "Home" | "Tasks">>();
  const navigation = useNavigation();

  const taskTab = (params?.task_tab || TaskTab.MY_TASKS) as TaskTab;
  const onChangeTaskTab = (tab: TaskTab) => {
    navigation.setParams({ task_tab: tab });
  };

  const onlyMine = taskTab === TaskTab.MY_TASKS;
  const { data, fetchMore, loading, refetch, error } = useQuery(
    GetFeedTasksDocument,
    {
      variables: {
        onlyMine,
      },
      skip: !user,
      notifyOnNetworkStatusChange: true,
    },
  );

  const [onLoadMore, fetchMoreState] = useFetchMore({
    data,
    fetchMore,
    limit: LIMIT,
    path: "getFeedTasks.meetings",
  });

  const listRef = useRef<FlatList>(null);

  const [collapsedMeetingIds, setCollapsedMeetingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [prevOnlyMine, setPrevOnlyMine] = useState(onlyMine);

  if (onlyMine !== prevOnlyMine) {
    setPrevOnlyMine(onlyMine);
    setCollapsedMeetingIds(new Set());
  }

  const toggleMeetingCollapsed = useCallback((meetingId: string) => {
    setCollapsedMeetingIds((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) {
        next.delete(meetingId);
      } else {
        next.add(meetingId);
      }
      return next;
    });
  }, []);

  const renderItem: ListRenderItem<CoreFeedMeetingFieldsFragment> = useCallback(
    ({ item }) => (
      <TaskMeetingCard
        meeting={item}
        key={item._id}
        isExpanded={!collapsedMeetingIds.has(item._id)}
        onToggle={toggleMeetingCollapsed}
      />
    ),
    [collapsedMeetingIds, toggleMeetingCollapsed],
  );

  const userEmail = user?.email;

  const filterMyTasks = useCallback(
    (task: CoreTaskFieldsFragment) => {
      return (
        task.ownerEmail === userEmail ||
        (!!task.ownerId &&
          userGroupIds.includes(task.ownerId) &&
          task.ownerType === EnumTaskOwnerType.UserGroup)
      );
    },
    [userEmail, userGroupIds],
  );

  const meetings = data?.getFeedTasks?.meetings;

  const shouldShowLoadingState = Boolean(loading && !meetings?.length);
  const shouldShowErrorState = Boolean(
    !loading && error && !data?.getFeedTasks,
  );
  const shouldShowEmptyState = !loading && !meetings?.length;

  useScrollToTop(listRef);

  return (
    <TasksContext.Provider value={{ onlyMine, filterMyTasks, sortTasks }}>
      <View style={styles.headerContainer(theme)}>
        <View style={styles.buttonsRow}>
          {TASK_TABS.map((tab) => {
            const isSelected = tab.value === taskTab;
            return (
              <Button
                key={tab.value}
                variant="outlined"
                size="sm"
                style={
                  isSelected
                    ? styles.selectedButton(theme)
                    : styles.unselectedButton
                }
                onPress={() => onChangeTaskTab(tab.value)}
              >
                <Text
                  variant="label2Regular"
                  color={
                    isSelected
                      ? theme.name === "dark"
                        ? "commandContrastDefault"
                        : "commandPrimaryDefault"
                      : "commandNeutralDefault"
                  }
                >
                  {tab.label}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>
      <Animated.FlatList
        contentContainerStyle={styles.container}
        ref={listRef}
        scrollEnabled={!shouldShowLoadingState}
        data={meetings}
        renderItem={renderItem}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          shouldShowLoadingState ? loadingTaskMeetingCards : null
        }
        ListFooterComponent={
          shouldShowErrorState ? (
            <MessageView
              variant="error"
              title="Could not load tasks"
              description={error?.message}
              action={<Button onPress={() => refetch()}>Retry</Button>}
            />
          ) : shouldShowEmptyState ? (
            <TasksEmptyState />
          ) : fetchMoreState.loading ? (
            loadingTaskMeetingCards
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={!!data?.getFeedTasks && loading}
            onRefresh={refetch}
          />
        }
        itemLayoutAnimation={itemLayoutAnimation}
      />
    </TasksContext.Provider>
  );
};

const styles = createStyles({
  container: {
    maxWidth: 724,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  headerContainer: (theme) => ({
    paddingTop: 8,
    backgroundColor: theme.colors.layerDefault,
  }),
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 12,
  },
  selectedButton: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderColor: theme.colors.borderStaticBrand,
    ...vars.elevations[2],
  }),
  unselectedButton: {
    ...vars.elevations[2],
  },
});
