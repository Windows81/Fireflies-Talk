import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import type { FC } from "react";

export const SilentRecordingDialog: FC<{
  isOpen: boolean;
  close: () => void;
  title: string;
}> = ({ isOpen, close, title }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="bottomSheet">
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>
          This might happen if you are on a call, another app is using the
          recording feature, or you are using a faulty audio equipment.
        </Dialog.Description>
        <Dialog.Description>
          If the problem persists, please contact our support team.
        </Dialog.Description>
      </Dialog.Body>
      <Dialog.Actions>
        <Button onPress={close}>Got it</Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
};
