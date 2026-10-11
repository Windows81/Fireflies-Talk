import { Select } from "@/components/Input";
import { Text } from "@/components/Typography";
import { SEND_NOTES_TO_OPTIONS } from "@/constants";
import { useUpdateOptionsSendNotesTo } from "@/features/settings";
import type { User } from "@/graphql";
import type { FC } from "react";
import { View } from "react-native";
import { styles } from "./styles";

export const SendNotesToSection: FC<{
  user: User;
}> = ({ user }) => {
  const {
    sendNotesTo,
    sendNotesToSettingsLocked,
    loadingUpdateOptions,
    updateSendNotesTo,
  } = useUpdateOptionsSendNotesTo({ user });
  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <Text
          variant="title3Regular"
          color="textSecondary"
          id="send-notes-to-setting-section-label"
        >
          Send email recap
        </Text>
        <Select
          value={sendNotesTo}
          onValueChange={updateSendNotesTo}
          options={SEND_NOTES_TO_OPTIONS(user)}
          disabled={loadingUpdateOptions || sendNotesToSettingsLocked}
          textProps={{
            color: "textMuted",
          }}
          size="sm"
          inline
          aria-labelledby="send-notes-to-setting-section-label"
        />
      </View>
    </View>
  );
};
