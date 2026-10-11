import { Button } from "@/components/Button";
import { TagInput } from "@/components/Input";
import { useSaveOptions } from "@/features/settings";
import { type User } from "@/graphql";
import { isDefined } from "@/utils/object";
import { useEffect, useState, type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

const MeetingSettingsFieldRules: FC<{
  user: User;
  isBarRules: boolean;
}> = ({ user, isBarRules }) => {
  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    user,
    successMessage: `${isBarRules ? "Bar" : "Join"} rules saved successfully`,
    errorMessage: `Could not save ${isBarRules ? "bar" : "join"} rules`,
  });

  const rules = isBarRules ? user.barRules : user.joinRules;

  const [value, setValue] = useState<string[]>([]);

  useEffect(() => {
    setValue(rules?.filter(isDefined) || []);
  }, [rules]);

  const hasChanged = value.join(",") !== (rules || [])?.join(",");

  const onSave = () => {
    updateOptions({
      variables: {
        [isBarRules ? "barRules" : "joinRules"]: value,
      },
    });
  };

  const onCancel = () => {
    setValue(rules?.filter(isDefined) || []);
  };

  const labelId = `${isBarRules ? "bar" : "join"}-rules-setting-section-label`;

  return (
    <SettingField>
      <SettingLabel
        id={labelId}
        title={`${isBarRules ? "Bar" : "Join"} Rules`}
        description={`Fred ${isBarRules ? "will not" : "will"} join your meetings if the meeting title contains the following words or meeting participants have following email addresses or domain`}
      />
      <TagInput
        value={value}
        onChangeValue={setValue}
        placeholder="Enter words, emails and press Enter to add"
        disabled={loadingUpdateOptions}
        aria-labelledby={labelId}
      />
      {hasChanged && (
        <SettingRow>
          <Button
            variant="transparentPrimary"
            size="xs"
            onPress={onSave}
            disabled={loadingUpdateOptions}
          >
            Save
          </Button>
          <Button
            variant="transparentNeutral"
            size="xs"
            onPress={onCancel}
            disabled={loadingUpdateOptions}
          >
            Cancel
          </Button>
        </SettingRow>
      )}
    </SettingField>
  );
};

export const MeetingSettingsRules: FC<{
  user: User;
}> = ({ user }) => {
  return (
    <SettingsGroup title="Meeting Rules">
      <MeetingSettingsFieldRules user={user} isBarRules />
      <MeetingSettingsFieldRules user={user} isBarRules={false} />
    </SettingsGroup>
  );
};
