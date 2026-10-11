import { toast } from "@/components/Toast";
import {
  FetchChannelMeetingsDocument,
  GetCurrentUserDocument,
  GetFeedMeetingsDocument,
  GetUserMeetingsForStatusDocument,
  useDeleteMeetingsMutation,
} from "@/graphql";
import { useNavigation } from "@react-navigation/native";

export const useDeleteMeeting = (meetingId: string, close: () => void) => {
  const navigation = useNavigation();

  const [deleteMeeting, { loading }] = useDeleteMeetingsMutation({
    variables: {
      meetingIds: [meetingId],
      source: "desktop-notepad",
    },
    refetchQueries: [
      GetFeedMeetingsDocument,
      FetchChannelMeetingsDocument,
      GetCurrentUserDocument,
      GetUserMeetingsForStatusDocument,
    ],
    onCompleted() {
      toast({ type: "success", message: "Meeting has been deleted." });
      close();
      navigation.goBack();
    },
    onError(err) {
      toast({
        type: "error",
        title: "Could not delete meeting",
        message: err.message,
      });
    },
  });

  return { deleteMeeting, loading };
};
