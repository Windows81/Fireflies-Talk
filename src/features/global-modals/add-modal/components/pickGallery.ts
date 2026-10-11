import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { uploadFromGallery } from "@/features/upload";
import { RootNavigation } from "@/screens/RootNavigation";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";

export async function pickGallery() {
  const user = useAuth.getState().user;
  const notesPrivacy = user?.privacy;

  try {
    const uploadResult = await uploadFromGallery(
      {
        notesPrivacy: notesPrivacy as MeetingNotesPrivacy,
      },
      {
        onError(err) {
          toast({
            title: "Could not upload file",
            type: "error",
            message: err.message,
          });
        },
      },
    );
    if (uploadResult.uploaded) {
      toast({
        message: "Upload has been started",
        action: {
          label: "View",
          onPress: () => RootNavigation.navigate("Upload"),
        },
        duration: 6000,
      });
      tracker.track(TRACKING_EVENTS.FILE_UPLOADED, {
        from: "home/add-button/gallery",
        mimeType: uploadResult.mimeType,
      });
    }
  } catch (err) {
    toast({
      title: "Something went wrong while uploading file",
      type: "error",
      message: (err as Error).message,
    });
  }
}
