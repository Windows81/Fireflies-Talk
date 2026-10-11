import { IconEdit, IconX } from "@/assets/svg/svgs.gen";
import { Text } from "@/components/Typography";
import type { FC, ReactNode } from "react";
import { Pressable } from "react-native";
import type { ShortcutKeycap } from "electron/src/dictation/shortcut-keys";
import type { ShortcutRecorderStatus } from "./useShortcutRecorder";
import {
  ShortcutItem,
  ShortcutItemText,
  ShortcutPill,
  ShortcutRow,
} from "./ShortcutRow";
import { ShortcutCaptureField } from "./ShortcutCaptureField";
import { ShortcutIconButton } from "./ShortcutIconButton";

interface DictationShortcutRowProps {
  addLabel?: string;
  description: string;
  disabled?: boolean;
  fixedItem?: { prefix: string; keycaps: ShortcutKeycap[] };
  hint?: string;
  icon: ReactNode;
  id: string;
  isLocked: boolean;
  isRecording: boolean;
  keycaps: ShortcutKeycap[];
  onCancel: () => void;
  onClear?: () => void;
  onRecord: () => void;
  prefix: string;
  progressKeycaps: ShortcutKeycap[];
  status: ShortcutRecorderStatus;
  title: string;
}

export const DictationShortcutRow: FC<DictationShortcutRowProps> = ({
  addLabel = "Add a shortcut",
  description,
  disabled,
  fixedItem,
  hint,
  icon,
  id,
  isLocked,
  isRecording,
  keycaps,
  onCancel,
  onClear,
  onRecord,
  prefix,
  progressKeycaps,
  status,
  title,
}) => {
  const controlsDisabled = disabled || isLocked;

  return (
    <ShortcutRow
      description={description}
      icon={icon}
      id={id}
      isLocked={isLocked || disabled}
      title={title}
    >
      {fixedItem ? (
        <ShortcutItem>
          <ShortcutPill {...fixedItem} />
        </ShortcutItem>
      ) : null}
      {isRecording ? (
        <ShortcutCaptureField keycaps={progressKeycaps} onCancel={onCancel} />
      ) : keycaps.length ? (
        <ShortcutItem
          actions={
            <>
              <ShortcutIconButton
                accessibilityLabel={`Change ${title.toLowerCase()}`}
                disabled={controlsDisabled}
                Icon={IconEdit}
                onPress={onRecord}
              />
              {onClear ? (
                <ShortcutIconButton
                  accessibilityLabel={`Remove ${title.toLowerCase()} shortcut`}
                  disabled={isLocked}
                  Icon={IconX}
                  onPress={onClear}
                />
              ) : null}
            </>
          }
        >
          <ShortcutPill prefix={prefix} keycaps={keycaps} />
        </ShortcutItem>
      ) : (
        <ShortcutItem>
          <Pressable
            accessibilityLabel={addLabel}
            accessibilityRole="button"
            disabled={controlsDisabled}
            onPress={onRecord}
          >
            <Text variant="body2Regular" color="textMuted">
              {addLabel}
            </Text>
          </Pressable>
        </ShortcutItem>
      )}
      {status.kind === "error" ? (
        <ShortcutItemText color="informationStaticRedText">
          {status.message}
        </ShortcutItemText>
      ) : isRecording ? (
        <ShortcutItemText color="textMuted">{hint}</ShortcutItemText>
      ) : null}
    </ShortcutRow>
  );
};
