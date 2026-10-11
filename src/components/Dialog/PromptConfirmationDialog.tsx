import { useState, useEffect, type FC } from "react";
import {
  ConfirmationDialog,
  type ConfirmationDialogProps,
} from "./ConfirmationDialog";

type ConfirmationProps = Omit<ConfirmationDialogProps, "isOpen" | "close">;

let globalConfirmationState: {
  isOpen: boolean;
  props: ConfirmationProps | null;
  setIsOpen: (open: boolean) => void;
  setProps: (props: ConfirmationProps | null) => void;
} | null = null;

export const promptConfirmation = (props: ConfirmationProps) => {
  if (!globalConfirmationState) {
    console.warn(
      "promptConfirmation called before StandaloneConfirmationDialog was mounted",
    );
    return;
  }
  globalConfirmationState.setProps(props);
  globalConfirmationState.setIsOpen(true);
};

export const PromptConfirmationDialog: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationProps, setConfirmationProps] =
    useState<ConfirmationProps | null>(null);

  useEffect(() => {
    globalConfirmationState = {
      isOpen,
      props: confirmationProps,
      setIsOpen,
      setProps: setConfirmationProps,
    };

    return () => {
      globalConfirmationState = null;
    };
  }, [isOpen, confirmationProps]);

  const handleClose = () => {
    setIsOpen(false);
    setConfirmationProps(null);
  };

  const handleCancel = () => {
    confirmationProps?.onCancel?.();
    handleClose();
  };

  const handleConfirm = () => {
    confirmationProps?.onConfirm?.();
    handleClose();
  };

  if (!confirmationProps) {
    return null;
  }

  return (
    <ConfirmationDialog
      {...confirmationProps}
      isOpen={isOpen}
      close={handleClose}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
};
