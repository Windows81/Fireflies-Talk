import { Select } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { AUTO_JOIN_OPTIONS, MANUAL_AUTO_JOIN_OPTION } from "@/constants";
import { useUpdateOptionsAutoJoin } from "@/features/settings";
import type { User } from "@/graphql";
import type { FC } from "react";
import { View } from "react-native";
import { styles } from "./styles";

export const AutoJoinSettingSection: FC<{
  user: User;
}> = ({ user }) => {
  const {
    isAutoJoinEnabled,
    toggleAutoJoin,
    loadingUpdateOptions,
    autoJoin,
    autoJoinSettingsLocked,
    updateAutojoin,
  } = useUpdateOptionsAutoJoin({ user });
  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <Text
          variant="title3Regular"
          color="textSecondary"
          id="auto-join-setting-section-label"
        >
          Auto join calendar meetings
        </Text>
        <Select
          value={autoJoin}
          onValueChange={updateAutojoin}
          options={
            isAutoJoinEnabled
              ? AUTO_JOIN_OPTIONS(user)
              : [MANUAL_AUTO_JOIN_OPTION]
          }
          disabled={
            !isAutoJoinEnabled || loadingUpdateOptions || autoJoinSettingsLocked
          }
          size="sm"
          inline
          textProps={{
            color: "textMuted",
          }}
          aria-labelledby="auto-join-setting-section-label"
        />
      </View>
      <Switch
        value={isAutoJoinEnabled}
        onValueChange={toggleAutoJoin}
        loading={loadingUpdateOptions}
        aria-label="Enable auto join calendar meetings"
      />
    </View>
  );
};
