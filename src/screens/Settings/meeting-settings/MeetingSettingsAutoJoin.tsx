import { Select } from "@/components/Input";
import { Switch } from "@/components/Switch";
import type { AutoJoin } from "@/constants";
import { AUTO_JOIN_OPTIONS, MANUAL_AUTO_JOIN_OPTION } from "@/constants";
import { useUpdateOptionsAutoJoin } from "@/features/settings";
import { type User } from "@/graphql";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const MeetingSettingsAutoJoin: FC<{
  user: User;
}> = ({ user }) => {
  const {
    isAutoJoinEnabled,
    toggleAutoJoin,
    autoJoin,
    // TODO: add tooltip explaining
    autoJoinSettingsLocked,
    loadingUpdateOptions,
    updateAutojoin,
  } = useUpdateOptionsAutoJoin({
    user,
    fromRef: "settings",
  });

  return (
    <SettingsGroup title="Autojoin Settings">
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Auto join calendar meetings"
            description="Choose which meetings Fireflies should automatically join"
            id="setting-label-auto-join"
          />
          <Switch
            value={isAutoJoinEnabled}
            onValueChange={toggleAutoJoin}
            loading={loadingUpdateOptions}
            disabled={autoJoinSettingsLocked}
            aria-labelledby="setting-label-auto-join"
          />
        </SettingRow>
        <Select
          value={autoJoin as AutoJoin}
          onValueChange={updateAutojoin}
          options={
            isAutoJoinEnabled
              ? AUTO_JOIN_OPTIONS(user)
              : [MANUAL_AUTO_JOIN_OPTION]
          }
          disabled={
            !isAutoJoinEnabled || loadingUpdateOptions || autoJoinSettingsLocked
          }
          aria-labelledby="setting-label-auto-join"
        />
      </SettingField>
    </SettingsGroup>
  );
};
