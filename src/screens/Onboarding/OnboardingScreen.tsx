import { LoadingScreen } from "@/components/Loading";
import type { TabsRef } from "@/components/Tabs";
import { Tabs } from "@/components/Tabs";
import { toast } from "@/components/Toast";
import { Config } from "@/constants";
import { captureException } from "@/errors";
import { useShouldShowOnboarding } from "@/features/onboarding";
import type { CompleteOnboardingStepMutationVariables } from "@/graphql";
import { useCompleteOnboardingStepMutation } from "@/graphql";
import { useTheme } from "@/styles";
import { isTruthy } from "@/utils/object";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import {
  AutoJoinAndRecapFooter,
  AutoJoinAndRecapTab,
  useAutoJoinAndRecapStates,
} from "./AutoJoinAndRecap/AutoJoinAndRecap";
import { OnboardingContext } from "./Context";
import { FinalModal } from "./FinalModal/FinalModal";
import {
  SelectLanguageFooter,
  SelectLanguageTab,
  useSelectLanguageStates,
} from "./SelectLanguage/SelectLanguage";
import {
  TeamOnboardingFooter,
  TeamOnboardingTab,
  useTeamOnboardingStates,
} from "./TeamOnboarding/TeamOnboarding";
import { BackHeader } from "./components/BackHeader";
import { useEverTrue, useExitOnboarding } from "./utils";
import { isDesktop } from "@/utils/device";

const StepIndicator: FC<{
  largeStep?: boolean;
  isCurrent: boolean;
}> = ({ largeStep, isCurrent }) => {
  const theme = useTheme();
  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isCurrent ? theme.colors.layerBrand : theme.colors.layerStrong,
    ),
  }));
  return (
    <Animated.View
      style={[styles.stepIndicator, { width: largeStep ? 48 : 24 }, animStyle]}
    />
  );
};

export const OnboardingScreen: FC<
  NativeStackScreenProps<ParamList, "Onboarding">
> = ({ navigation }) => {
  const {
    shouldShowAutoJoinAndRecapOnboarding,
    shouldShowSelectLanguageOnboarding,
    shouldShowTeamOnboarding,
    loading,
  } = useShouldShowOnboarding();

  const hasAutoJoinAndRecapStep = useEverTrue(
    shouldShowAutoJoinAndRecapOnboarding,
  );
  const hasTeamOnboardingStep = useEverTrue(shouldShowTeamOnboarding);
  const hasSelectLanguageStep = useEverTrue(shouldShowSelectLanguageOnboarding);

  const steps: {
    key: string;
    content: React.ReactNode | null;
    footer: React.ReactNode;
    largeStep?: boolean;
  }[] = useMemo(
    () =>
      [
        hasAutoJoinAndRecapStep && {
          key: "auto-join-and-recap",
          content: <AutoJoinAndRecapTab />,
          footer: <AutoJoinAndRecapFooter />,
          largeStep: false,
        },
        hasTeamOnboardingStep && {
          key: "team-onboarding",
          content: <TeamOnboardingTab />,
          footer: <TeamOnboardingFooter />,
          largeStep: true,
        },
        hasSelectLanguageStep && {
          key: "select-language",
          content: <SelectLanguageTab />,
          footer: <SelectLanguageFooter />,
        },
      ].filter(isTruthy),
    [hasAutoJoinAndRecapStep, hasTeamOnboardingStep, hasSelectLanguageStep],
  );

  const [showFinal, setShowFinal] = useState(false);
  const [index, setIndex] = useState(0);

  const tabRef = useRef<TabsRef>(null);

  const exitOnboarding = useExitOnboarding();

  const goPrev = useCallback(() => {
    if (index === 0) {
      // invalid state, better to just exit onboarding
      exitOnboarding();
    }
    tabRef.current?.setTab(index - 1);
  }, [index, exitOnboarding]);

  const goNext = useCallback(() => {
    if (index < steps.length - 1) {
      tabRef.current?.setTab(index + 1);
    } else {
      setShowFinal(true);
    }
  }, [index, steps.length]);

  useEffect(() => {
    if (loading) return;
    if (steps.length === 0) {
      captureException(new Error("No onboarding steps"), {
        contexts: {
          states: { index },
        },
        tags: {
          section: "onboarding",
        },
      });
      exitOnboarding();
      return;
    }
    // fix invalid state
    if (index > steps.length - 1) {
      tabRef.current?.setTab(steps.length - 1);
    }
  }, [index, steps.length, exitOnboarding, loading]);

  const [completeOnboardingStep, { loading: loadingCompleteOnboardingStep }] =
    useCompleteOnboardingStepMutation({
      onError(err) {
        toast({
          message: err.message,
          type: "error",
        });
      },
    });

  const completeStep = useCallback(
    ({ extraInfo, step, skip }: CompleteOnboardingStepMutationVariables) => {
      completeOnboardingStep({
        variables: {
          extraInfo: {
            ...extraInfo,
            source: Config.NAME,
          },
          step,
          skip,
        },
      });
      goNext();
    },
    [completeOnboardingStep, goNext],
  );

  const autoJoinAndRecapStates = useAutoJoinAndRecapStates();
  const teamOnboardingStates = useTeamOnboardingStates();
  const selectLanguageStates = useSelectLanguageStates();

  const onTabChange = useCallback(
    (key: string) => {
      setIndex(steps.findIndex((step) => step.key === key));
    },
    [steps],
  );

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (showFinal) return;
        e.preventDefault();
      }),
    [navigation, showFinal],
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (showFinal) {
    return (
      <FinalModal
        loading={loadingCompleteOnboardingStep}
        completeOnboardingStep={completeOnboardingStep}
      />
    );
  }

  return (
    <OnboardingContext.Provider
      value={{
        index,
        goNext,
        goPrev,
        completeStep,
        ...autoJoinAndRecapStates,
        ...teamOnboardingStates,
        ...selectLanguageStates,
      }}
    >
      <SafeAreaView nativeID="drag-region" style={styles.root}>
        <View style={styles.container}>
          <Tabs.Root ref={tabRef} hideTabBar onTabChange={onTabChange} disabled>
            {steps.map((step, index) => (
              <Tabs.Panel key={step.key} name={step.key} title="">
                {index > 0 && <BackHeader />}
                <ScrollView
                  nativeID="no-drag"
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                >
                  {step.content}
                </ScrollView>
              </Tabs.Panel>
            ))}
          </Tabs.Root>
        </View>
        <View style={styles.stepIndicators}>
          {steps.map((step, i) => (
            <StepIndicator
              key={step.key}
              largeStep={step.largeStep}
              isCurrent={index === i}
            />
          ))}
        </View>
        <View style={styles.footer}>{steps[index]?.footer}</View>
      </SafeAreaView>
    </OnboardingContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: isDesktop ? 50 : 0,
  },
  stepIndicators: {
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  stepIndicator: {
    height: 4,
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
});
