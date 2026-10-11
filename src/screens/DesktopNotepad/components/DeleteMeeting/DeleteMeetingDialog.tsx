import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { getNotepadTitle } from "../../helpers/meeting";
import type { DesktopNotepadMeeting } from "../../types";
import { useDeleteMeeting } from "./useDeleteMeeting";

type PressableState = { pressed: boolean; hovered?: boolean };

const KeepButton: FC<{ onPress: () => void }> = ({ onPress }) => {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      {({ hovered }: PressableState) => (
        <View
          style={[
            styles.button,
            styles.keepButton(theme),
            hovered && { backgroundColor: DESKTOP_THEME.grey800 },
          ]}
        >
          <Text variant="label2Weight" color="commandNeutralDefault">
            Keep It
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const DeleteButton: FC<{ onPress: () => void; loading: boolean }> = ({
  onPress,
  loading,
}) => (
  <Pressable onPress={onPress} disabled={loading}>
    {({ hovered }: PressableState) => (
      <View
        style={[
          styles.button,
          { backgroundColor: DESKTOP_THEME.red800 },
          hovered && { backgroundColor: DESKTOP_THEME.red700 },
          loading && styles.buttonLoading,
        ]}
      >
        <Text variant="label2Weight" color="commandContrastDefault">
          {loading ? "Deleting..." : "Delete"}
        </Text>
      </View>
    )}
  </Pressable>
);

const DeleteMeetingContent: FC<{
  meeting: DesktopNotepadMeeting;
  close: () => void;
}> = ({ meeting, close }) => {
  const { deleteMeeting, loading } = useDeleteMeeting(meeting.id, close);

  return (
    <>
      <View style={styles.header}>
        <Text variant="body1Weight" color="textSecondary">
          Delete ‘{getNotepadTitle(meeting)}’?
        </Text>
      </View>

      <View style={styles.content}>
        <Text variant="body2LongRegular" color="textSecondary">
          Once the meeting is deleted, you will not be able to restore it. The
          minutes consumed on your account will be decreased.
        </Text>
      </View>

      <View style={styles.footer}>
        <KeepButton onPress={close} />
        <DeleteButton onPress={() => deleteMeeting()} loading={loading} />
      </View>
    </>
  );
};

export const DeleteMeetingDialog: FC<{
  meeting: DesktopNotepadMeeting;
  isOpen: boolean;
  close: () => void;
}> = ({ meeting, isOpen, close }) => {
  const theme = useTheme();
  return (
    <Dialog.Root
      variant="basic"
      isOpen={isOpen}
      close={close}
      style={styles.dialog(theme)}
    >
      {isOpen && <DeleteMeetingContent meeting={meeting} close={close} />}
    </Dialog.Root>
  );
};

const styles = createStyles({
  dialog: (theme) => ({
    width: 530,
    maxWidth: 530,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingLeft: 24,
    paddingRight: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  button: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  keepButton: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveDefault,
  }),
  buttonLoading: {
    opacity: 0.7,
  },
});
