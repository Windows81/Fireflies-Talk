import { memo, type FC } from "react";
import { View } from "react-native";
import { createStyles } from "@/styles";
import type { User } from "@/graphql";
import { GreetingSection } from "./GreetingSection";

interface Props {
  user: User;
  isNewUser?: boolean;
}

export const DesktopPersonalAssistantSection: FC<Props> = memo(
  ({ user, isNewUser }) => {
    return (
      <View style={styles.greeting}>
        <GreetingSection user={user} isNewUser={isNewUser} />
      </View>
    );
  },
);

DesktopPersonalAssistantSection.displayName = "DesktopPersonalAssistantSection";

const styles = createStyles({
  greeting: {
    paddingLeft: 16,
  },
});
