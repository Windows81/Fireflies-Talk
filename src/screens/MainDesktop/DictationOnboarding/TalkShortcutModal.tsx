import { IconEdit, IconX } from "@/assets/svg/svgs.gen";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import {
  useIsTalkActionModeFlagOn,
  useLocalSettings,
} from "@/features/settings";
import { createStyles, useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import {
  handsFreeBindingsEqual,
  normalizeHandsFreeBinding,
} from "electron/src/dictation/hands-free-binding";
import {
  defaultDictationBinding,
  dictationBindingsEqual,
  normalizeDictationBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import { getDictationBindingKeycaps } from "electron/src/dictation/shortcut-keys";
import {
  HandsFreeIcon,
  PushToTalkIcon,
} from "@/screens/DesktopSettings/dictation-settings/ShortcutModeIcons";
import {
  ShortcutItem,
  ShortcutPill,
  ShortcutRow,
  ShortcutRowsGroup,
} from "@/screens/DesktopSettings/dictation-settings/ShortcutRow";
import { ShortcutCaptureField } from "@/screens/DesktopSettings/dictation-settings/ShortcutCaptureField";
import { ShortcutIconButton } from "@/screens/DesktopSettings/dictation-settings/ShortcutIconButton";
import { useOnboardingShortcutCapture } from "./useOnboardingShortcutCapture";
import { useCallback, useState, type FC } from "react";
import { Pressable, View } from "react-native";

interface TalkShortcutModalProps {
  onClose: () => void;
}

export const TalkShortcutModal: FC<TalkShortcutModalProps> = ({ onClose }) => {
  const theme = useTheme();
  const {
    dictationShortcut,
    actionShortcut,
    handsFreeShortcut,
    polishShortcut,
    setDictationShortcut,
    setHandsFreeShortcut,
  } = useLocalSettings();
  const actionModeAvailable = useIsTalkActionModeFlagOn();
  const platform = getActualPlatform();
  const isMac = platform === "darwin";

  const saved = normalizeDictationBinding(dictationShortcut, platform);
  const savedHandsFree = normalizeHandsFreeBinding(handsFreeShortcut, platform);
  const [draft, setDraft] = useState(saved);
  const [handsFreeDraft, setHandsFreeDraft] = useState(savedHandsFree);

  const dirty =
    !dictationBindingsEqual(draft, saved) ||
    !handsFreeBindingsEqual(handsFreeDraft, savedHandsFree);
  const keycaps = getDictationBindingKeycaps(draft, { isMac });
  const handleDictationCaptured = useCallback(
    (binding: DictationBinding) => setDraft(binding),
    [],
  );
  const handleHandsFreeCaptured = useCallback(
    (binding: DictationBinding) => setHandsFreeDraft(binding),
    [],
  );
  const handleHandsFreeConflict = useCallback(
    () => setHandsFreeDraft(null),
    [],
  );
  const { capturing, handleCancelCapture, handleRecord, progress } =
    useOnboardingShortcutCapture({
      actionModeAvailable,
      actionShortcut,
      draft,
      handsFreeDraft,
      onDictationCaptured: handleDictationCaptured,
      onHandsFreeCaptured: handleHandsFreeCaptured,
      onHandsFreeConflict: handleHandsFreeConflict,
      platform,
      polishShortcut,
    });
  const progressKeycaps = progress
    ? getDictationBindingKeycaps(progress, { isMac })
    : [];
  const handleClose = useCallback(() => {
    if (capturing) handleCancelCapture();
    onClose();
  }, [capturing, handleCancelCapture, onClose]);

  const handleReset = useCallback(() => {
    setDraft(defaultDictationBinding(platform));
    setHandsFreeDraft(null);
  }, [platform]);

  const handleSave = useCallback(async () => {
    setDictationShortcut(draft);
    setHandsFreeShortcut(handsFreeDraft);
    // The store alone does not reach the main process — only the settings
    // screen syncs it on mount, so the hotkey is applied here directly.
    await window.electron?.dictation?.setShortcut?.(draft);
    await window.electron?.dictation?.setHandsFreeShortcut?.(handsFreeDraft);
    onClose();
  }, [
    draft,
    handsFreeDraft,
    onClose,
    setDictationShortcut,
    setHandsFreeShortcut,
  ]);

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text variant="body1Weight" color="textPrimary">
          Talk Shortcut
        </Text>
        <ShortcutIconButton
          accessibilityLabel="Close"
          Icon={IconX}
          onPress={handleClose}
        />
      </View>

      <ShortcutRowsGroup layout="column">
        <ShortcutRow
          icon={<PushToTalkIcon color={theme.colors.textMuted} />}
          isLocked={capturing !== null && capturing !== "dictation"}
          title="Push to talk"
          description="Hold hotkey to dictate something short"
        >
          {capturing === "dictation" ? (
            <ShortcutCaptureField
              keycaps={progressKeycaps}
              onCancel={handleCancelCapture}
            />
          ) : (
            <ShortcutItem
              actions={
                <ShortcutIconButton
                  accessibilityLabel="Change push to talk shortcut"
                  disabled={capturing !== null}
                  Icon={IconEdit}
                  onPress={() => void handleRecord("dictation")}
                />
              }
            >
              <ShortcutPill prefix="Hold" keycaps={keycaps} />
            </ShortcutItem>
          )}
        </ShortcutRow>

        <ShortcutRow
          icon={<HandsFreeIcon color={theme.colors.textMuted} />}
          isLocked={capturing !== null && capturing !== "handsFree"}
          title="Hands-free mode"
          description="Double-tap the hotkey, or use your own shortcut"
        >
          <ShortcutItem>
            <ShortcutPill prefix="Double-tap" keycaps={keycaps} />
          </ShortcutItem>
          {capturing === "handsFree" ? (
            <ShortcutCaptureField
              keycaps={progressKeycaps}
              onCancel={handleCancelCapture}
            />
          ) : handsFreeDraft ? (
            <ShortcutItem
              actions={
                <>
                  <ShortcutIconButton
                    accessibilityLabel="Change hands-free shortcut"
                    disabled={capturing !== null}
                    Icon={IconEdit}
                    onPress={() => void handleRecord("handsFree")}
                  />
                  <ShortcutIconButton
                    accessibilityLabel="Remove hands-free shortcut"
                    disabled={capturing !== null}
                    Icon={IconX}
                    onPress={() => setHandsFreeDraft(null)}
                  />
                </>
              }
            >
              <ShortcutPill
                prefix="or press"
                keycaps={getDictationBindingKeycaps(handsFreeDraft, {
                  isMac,
                })}
              />
            </ShortcutItem>
          ) : (
            <ShortcutItem>
              <Pressable
                disabled={capturing !== null}
                onPress={() => void handleRecord("handsFree")}
                accessibilityRole="button"
                accessibilityLabel="Add a hands-free shortcut"
              >
                <Text variant="body2Regular" color="textMuted">
                  Add a shortcut
                </Text>
              </Pressable>
            </ShortcutItem>
          )}
        </ShortcutRow>
      </ShortcutRowsGroup>

      {capturing ? (
        <Text variant="body2Regular" color="textMuted">
          Press a shortcut or side mouse button. Esc cancels.
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          style={styles.resetButton}
        >
          <Text variant="body2Regular" color="textMuted">
            Reset To Default
          </Text>
        </Pressable>
        <Button
          variant="primary"
          disabled={!dirty}
          onPress={() => void handleSave()}
        >
          Save Changes
        </Button>
      </View>
    </View>
  );
};

const styles = createStyles({
  content: {
    alignSelf: "stretch" as const,
    width: "100%" as const,
    gap: 20,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  footer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  resetButton: {
    paddingVertical: 8,
    cursor: "pointer" as never,
  },
});
