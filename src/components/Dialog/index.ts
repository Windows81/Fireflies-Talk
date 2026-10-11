import {
  DialogActions,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogRoot,
} from "./Dialog";

export const Dialog = {
  Root: DialogRoot,
  Header: DialogHeader,
  Body: DialogBody,
  Description: DialogDescription,
  Actions: DialogActions,
  Close: DialogClose,
};

export {
  ConfirmationDialog,
  type ConfirmationDialogProps,
} from "./ConfirmationDialog";

export type { DialogProps } from "./types";

export { BaseModal } from "./BaseModal";

export { CoordinatedModal } from "./CoordinatedModal";

export {
  PromptConfirmationDialog,
  promptConfirmation,
} from "./PromptConfirmationDialog";
