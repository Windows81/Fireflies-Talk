import { IconGlobe } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Select } from "@/components/Input";
import { toast } from "@/components/Toast";
import { authApi } from "@/features/auth";
import { useLanguageOptions } from "@/features/language";
import { useFindLanguageBest } from "@/features/remote-constants";
import {
  EnumOnboardingStep,
  useGetCurrentUserQuery,
  useSaveOptionsMutation,
} from "@/graphql";
import { useTheme } from "@/styles";
import { useContext, useEffect, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../Context";
import { HeaderBlock } from "../components/HeaderBlock";
import { TitleHeader } from "../components/HeaderTitle";

export const SelectLanguageTab: FC = () => {
  const theme = useTheme();
  const languageOptions = useLanguageOptions();

  const { language, setLanguage } = useContext(OnboardingContext);

  return (
    <View style={styles.root}>
      <HeaderBlock>
        <IconGlobe width={20} height={20} color={theme.colors.textPrimary} />
      </HeaderBlock>
      <TitleHeader
        title="In which language do you have your meetings?"
        description="Fireflies supports 69+ languages! Transcribe and summarize your meetings in your preferred language."
      />
      <View style={styles.form}>
        <Select
          value={language}
          onValueChange={setLanguage}
          options={languageOptions}
          aria-label="Select language"
          showSearch
        />
      </View>
    </View>
  );
};

export const SelectLanguageFooter: FC = () => {
  const { completeStep, language } = useContext(OnboardingContext);

  const [saveOptions, { loading }] = useSaveOptionsMutation({
    variables: {
      preferredLanguage: language,
    },
    onCompleted({ saveOptions }) {
      if (saveOptions?.preferredLanguage) {
        authApi.updateUser({
          preferredLanguage: saveOptions.preferredLanguage,
        });
      }
    },
    onError(err) {
      toast({
        title: "Could not save language",
        message: err.message,
        type: "error",
      });
    },
  });

  const onPress = () => {
    saveOptions().finally(() => {
      completeStep({
        step: EnumOnboardingStep.SelectLanguage,
        skip: false,
        extraInfo: {},
      });
    });
  };

  return (
    <Button onPress={onPress} disabled={loading}>
      Continue
    </Button>
  );
};

export const useSelectLanguageStates = () => {
  const { data: dataUser } = useGetCurrentUserQuery();
  const findLanguageBest = useFindLanguageBest();

  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (dataUser?.user?.preferredLanguage) {
      setLanguage(
        findLanguageBest(dataUser.user.preferredLanguage)?.code || "en",
      );
    }
  }, [dataUser?.user?.preferredLanguage, findLanguageBest]);

  return {
    language,
    setLanguage,
  };
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  form: {
    marginTop: 32,
  },
});
