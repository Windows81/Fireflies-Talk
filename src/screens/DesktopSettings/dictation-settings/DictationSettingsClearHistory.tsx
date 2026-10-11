import { Button } from "@/components/Button";
import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { useDictationHistory } from "@/hooks/dictationHistory";
import { useBooleanState } from "@/utils/states";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const DictationSettingsClearHistory: FC = () => {
  const [isDialogOpen, openDialog, closeDialog] = useBooleanState();
  const userId = useAuth((s) => s.user?.id);
  const hasEntries = useDictationHistory((s) =>
    s.entries.some((entry) => entry.userId === userId),
  );
  const clearEntries = useDictationHistory((s) => s.clearEntries);

  const clearHistory = () => {
    if (!userId) return;
    clearEntries(userId);
    toast({ message: "Dictation history cleared" });
  };

  return (
    <>
      <SettingsGroup>
        <SettingField>
          <SettingRow>
            <SettingLabel
              title="Clear dictation history"
              description="Removes every dictation from your history on this device. Your streak and word count stay."
              id="setting-label-dictation-clear-history"
            />
            <Button
              variant="danger"
              size="sm"
              disabled={!hasEntries}
              onPress={openDialog}
            >
              Clear history
            </Button>
          </SettingRow>
        </SettingField>
      </SettingsGroup>
      <ConfirmationDialog
        title="Clear dictation history?"
        isOpen={isDialogOpen}
        close={closeDialog}
        onConfirm={clearHistory}
        confirmText="Clear history"
        confirmVariant="danger"
      >
        Every dictation in your history on this device will be removed. This
        cannot be undone.
      </ConfirmationDialog>
    </>
  );
};
