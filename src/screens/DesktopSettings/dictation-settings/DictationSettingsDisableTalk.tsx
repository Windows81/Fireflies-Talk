import { Button } from "@/components/Button";
import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import { useUpdateDisableFirefliesTalkMutation } from "@/graphql";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useBooleanState } from "@/utils/states";

export const DictationSettingsDisableTalk: FC = () => {
  const [isDialogOpen, openDialog, closeDialog] = useBooleanState();
  const [updateDisableFirefliesTalk, { loading }] =
    useUpdateDisableFirefliesTalkMutation({
      refetchQueries: ["getCurrentUser"],
      awaitRefetchQueries: true,
      onError(error) {
        toast({
          title: "Couldn't turn off Fireflies Talk",
          message: error.message,
        });
      },
    });

  const turnOff = () => {
    closeDialog();
    updateDisableFirefliesTalk({
      variables: { metadata: { disableFirefliesTalk: true } },
    });
  };

  return (
    <>
      <SettingsGroup>
        <SettingField>
          <SettingRow>
            <SettingLabel
              title="Turn off Fireflies Talk"
              description="Turns off dictation, the floating pill, and every Talk shortcut for your account. You can turn it back on from this tab."
              id="setting-label-dictation-disable-talk"
            />
            <Button
              variant="danger"
              size="sm"
              disabled={loading}
              onPress={openDialog}
            >
              Turn off
            </Button>
          </SettingRow>
        </SettingField>
      </SettingsGroup>
      <ConfirmationDialog
        title="Turn off Fireflies Talk?"
        isOpen={isDialogOpen}
        close={closeDialog}
        onConfirm={turnOff}
        confirmText="Turn off"
        confirmVariant="danger"
      >
        Dictation, the floating pill, and Talk shortcuts will stop working for
        your account until you turn it back on.
      </ConfirmationDialog>
    </>
  );
};
