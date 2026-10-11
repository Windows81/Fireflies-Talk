import { IconPlus } from "@/assets/svg";
import { FabButton, FabButtonContainer } from "@/components/FabButton";
import { Tabs, type TabsRef } from "@/components/Tabs";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import { CreateTopicTrackerModal } from "@/features/topic-tracker";
import { TopicType } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { isFreeUser } from "@firefliesai/payments-ff.utils";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useRef, type FC } from "react";
import { StyleSheet, View } from "react-native";
import type { ParamList } from "../types";
import { TopicTrackersTab } from "./components/TopicTrackersTab";
import { TopicTabNames } from "./constants";
import { useRouteParamState } from "@/features/navigation";

export const TopicTrackerScreen: FC<
  NativeStackScreenProps<ParamList, "TopicTracker">
> = ({ route }) => {
  const ref = useRef<TabsRef>(null);

  const { isAdmin, team } = useTeam();
  const { user } = useAuth();
  const freeUser = useMemo(
    () => !user?.paidUser || isFreeUser(user?.paidUser),
    [user],
  );

  const [isOpenCreate, openCreate, closeCreate] = useBooleanState();

  const [tab, setTab] = useRouteParamState<string>("tab");

  return (
    <>
      <View style={styles.root}>
        <Tabs.Root ref={ref} initialTab={tab} onTabChange={setTab}>
          <Tabs.Panel name={TopicTabNames.Mine} title="My Topics">
            <TopicTrackersTab
              topicType={TopicType.Mine}
              isAdmin={isAdmin}
              teammates={team?.teammates}
              freeUser={freeUser}
            />
          </Tabs.Panel>
          <Tabs.Panel name={TopicTabNames.Workspace} title="Workspace">
            <TopicTrackersTab
              topicType={TopicType.Enabled}
              isAdmin={isAdmin}
              teammates={team?.teammates}
              freeUser={freeUser}
            />
          </Tabs.Panel>
          {isAdmin && (
            <Tabs.Panel name={TopicTabNames.Team} title="Team">
              <TopicTrackersTab
                topicType={TopicType.Team}
                isAdmin={isAdmin}
                teammates={team?.teammates}
                freeUser={freeUser}
              />
            </Tabs.Panel>
          )}
        </Tabs.Root>
      </View>
      <FabButtonContainer>
        {route.params?.tab === "mine" && (
          <FabButton
            Icon={IconPlus}
            onPress={() => {
              openCreate();
            }}
            aria-label="Create topic tracker"
          />
        )}
      </FabButtonContainer>

      <CreateTopicTrackerModal
        isOpen={isOpenCreate}
        close={closeCreate}
        isAdmin={isAdmin}
      />
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
});
