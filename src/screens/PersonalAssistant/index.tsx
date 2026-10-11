import { IconArrowLeft } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackRouteConfig } from "../types";
import { DailyBriefScreen } from "./DailyBrief/DailyBriefScreen";
import { MeetingPrepScreen } from "./MeetingPrep/MeetingPrepScreen";
import { Tasks } from "../Home/Tasks/Tasks";
import { useIsNotificationBarsVisible } from "../components";

const ScreenHeader: FC<NativeStackHeaderProps & { title: string }> = ({
  navigation,
  title,
}) => {
  const theme = useTheme();
  // When the top notification bar covers the status bar, skip the top safe
  // area edge here to avoid doubling the inset and inflating the header.
  const isNotificationBarVisible = useIsNotificationBarsVisible();
  const edges = isNotificationBarVisible
    ? (["left", "right"] as const)
    : (["top", "left", "right"] as const);
  return (
    <SafeAreaView style={headerStyles.root(theme)} edges={edges}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={8}
        aria-label="Back"
      >
        <IconArrowLeft
          width={24}
          height={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>
      <Text variant="title2Weight" color="textSecondary">
        {title}
      </Text>
    </SafeAreaView>
  );
};

const headerStyles = createStyles({
  root: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.layerMuted,
  }),
});

export const DailyBriefRouteConfig: StackRouteConfig<"DailyBrief"> = {
  name: "DailyBrief",
  component: DailyBriefScreen,
  options: {
    header: (props) => <ScreenHeader {...props} title="Daily Brief" />,
  },
};

export const MeetingPrepRouteConfig: StackRouteConfig<"MeetingPrep"> = {
  name: "MeetingPrep",
  component: MeetingPrepScreen,
  options: {
    header: (props) => <ScreenHeader {...props} title="Meeting Prep" />,
  },
};

export const TasksRouteConfig: StackRouteConfig<"Tasks"> = {
  name: "Tasks",
  component: Tasks,
  options: {
    header: (props) => <ScreenHeader {...props} title="Tasks" />,
  },
};
