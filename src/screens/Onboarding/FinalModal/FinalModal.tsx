import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import type { useCompleteOnboardingStepMutation } from "@/graphql";
import { EnumOnboardingStep, GetCurrentUserDocument } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useApolloClient } from "@apollo/client";
import { useEffect, useRef, type FC } from "react";
import { View } from "react-native";
import { useExitOnboarding } from "../utils";

export const FinalModal: FC<{
  loading: boolean;
  completeOnboardingStep: ReturnType<
    typeof useCompleteOnboardingStepMutation
  >[0];
}> = ({ loading, completeOnboardingStep }) => {
  const theme = useTheme();

  const client = useApolloClient();

  const exitOnboarding = useExitOnboarding();

  const hasFinalizedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (hasFinalizedRef.current) return;
    hasFinalizedRef.current = true;
    // refetch user to get latest completedOnboardingStep
    completeOnboardingStep({
      variables: {
        step: EnumOnboardingStep.Completed,
        extraInfo: {
          source: Config.NAME,
        },
      },
    }).finally(() => {
      client
        .refetchQueries({
          include: [GetCurrentUserDocument],
        })
        .finally(exitOnboarding);
    });
  }, [loading, client, completeOnboardingStep, exitOnboarding]);

  return (
    <View style={styles.root(theme)}>
      <Text variant="title1Regular">
        Setting up your AI meeting assistant....
      </Text>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerDefault,
    justifyContent: "center",
    alignItems: "center",
  }),
});
