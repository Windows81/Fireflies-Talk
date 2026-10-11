import { IconGlobe } from "@/assets/svg";
import { Select } from "@/components/Input";
import { SkeletonLoading } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { useLanguageOptions } from "@/features/language";
import { useUpdateOptionsLanguage } from "@/features/settings";
import type { User } from "@/graphql";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const LanguageSettingSection: FC<{
  user: User;
}> = ({ user }) => {
  const theme = useTheme();
  const languageOptions = useLanguageOptions();

  const { language, loadingUpdateOptions, updateLanguage } =
    useUpdateOptionsLanguage({ user });

  return (
    <View style={styles.root}>
      <IconGlobe color={theme.colors.textMuted} />
      <Text
        variant="label2Regular"
        color="textSecondary"
        id="language-setting-section-label"
      >
        Meeting language
      </Text>
      <Select
        value={language}
        onValueChange={updateLanguage}
        options={languageOptions}
        disabled={loadingUpdateOptions}
        textProps={{
          color: "informationStaticBlueText",
          variant: "label2Regular",
        }}
        size="sm"
        inline
        aria-labelledby="language-setting-section-label"
        showSearch
      />
    </View>
  );
};

export const LanguageSettingSectionLoading: FC = () => {
  return (
    <View style={styles.root}>
      <SkeletonLoading width={24} height={24} variant="rect" />
      <SkeletonLoading width={180} height={24} variant="rect" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
