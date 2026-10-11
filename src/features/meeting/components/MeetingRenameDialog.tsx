import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { useUpdateMeetingTitleMutation, type Meeting } from "@/graphql";
import { notifyMeetingTitleUpdateFailed } from "../utils/title-cache";
import { applyMeetingTitleRename } from "../utils/title-sync";
import { useState, type FC } from "react";

const MeetingRenameDialogContent: FC<{
  meeting: Meeting;
  close: () => void;
}> = ({ meeting, close }) => {
  const [title, setTitle] = useState(meeting.title);
  const formattedTitle = title.trim();

  const [updateMeetingTitle, { loading }] = useUpdateMeetingTitleMutation({
    variables: {
      meetingId: meeting.id,
      title: formattedTitle,
    },
    onCompleted(data) {
      const newTitle = data?.updateMeetingTitle;
      if (newTitle) applyMeetingTitleRename(meeting.id, newTitle);
      toast({
        message: "Meeting title updated",
        type: "success",
      });
      close();
    },
    onError(error) {
      notifyMeetingTitleUpdateFailed(error);
    },
  });

  const onRename = () => {
    if (!formattedTitle || loading) {
      return;
    }
    updateMeetingTitle();
  };

  return (
    <>
      <Dialog.Header>Rename Meeting</Dialog.Header>
      <Dialog.Body>
        <TextInput
          aria-label="Meeting Title"
          placeholder="Enter the new meeting title"
          value={title}
          onValueChange={setTitle}
          disabled={loading}
        />
        <Button onPress={onRename} disabled={!formattedTitle || loading}>
          Rename
        </Button>
      </Dialog.Body>
    </>
  );
};

export const MeetingRenameDialog: FC<{
  meeting: Meeting;
  isOpen: boolean;
  close: () => void;
}> = ({ meeting, isOpen, close }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close}>
      <MeetingRenameDialogContent meeting={meeting} close={close} />
    </Dialog.Root>
  );
};
