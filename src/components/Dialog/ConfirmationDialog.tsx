import { createStyles } from "@/styles";
import { isValidElement, type FC, type ReactNode } from "react";
import { View } from "react-native";
import { Button } from "../Button";
import type { ButtonProps } from "../Button/types";
import { Text } from "../Typography";
import { DialogHeader, DialogRoot } from "./Dialog";
import type { DialogProps } from "./types";

export type ConfirmationDialogProps = Omit<DialogProps, "onDismiss"> & {
  title: string;
  children?: string | ReactNode;
  cancelText?: string;
  onCancel?: () => void;
  confirmText?: string;
  confirmVariant?: ButtonProps["variant"];
  onConfirm?: () => void;
  highlightCancel?: boolean;
  loading?: boolean;
  hideCloseOnHeader?: boolean;
};

export const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
  title,
  confirmText = "Confirm",
  confirmVariant,
  onConfirm,
  cancelText = "Cancel",
  onCancel,
  highlightCancel = false,
  hideCloseOnHeader = false,
  children,
  loading,
  ...props
}) => {
  const cancel = () => {
    props.close?.();
    onCancel?.();
  };

  const confirm = () => {
    props.close?.();
    onConfirm?.();
  };

  return (
    <DialogRoot {...props} onDismiss={() => {}}>
      <DialogHeader hideCloseOnHeader={hideCloseOnHeader}>{title}</DialogHeader>
      <View style={styles.content}>
        {isValidElement(children)
          ? children
          : children && (
              <Text variant="body2Regular" color="textSecondary">
                {children}
              </Text>
            )}
        <View style={styles.buttons}>
          {cancelText && (
            <Button
              variant={highlightCancel ? "primary" : "secondary"}
              onPress={cancel}
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={
              confirmVariant ?? (highlightCancel ? "outlined" : "primary")
            }
            disabled={loading}
            onPress={confirm}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </DialogRoot>
  );
};

const styles = createStyles({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
});
