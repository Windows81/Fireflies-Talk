import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { triggerDownloadFile } from "@/utils/file";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";

export const BiteDownloadDialog: FC<{
  bite: Soundbite;
  isOpen: boolean;
  close: () => void;
}> = ({ bite, isOpen, close }) => {
  if (!bite.sources) return;

  return (
    <BottomSheetMenuModal
      isOpen={isOpen}
      close={close}
      items={bite.sources.map((source) => ({
        label: `Download ${
          source.type?.startsWith("video") ? "Video" : "Audio"
        }`,
        onPress() {
          triggerDownloadFile(source.src);
          tracker.track(TRACKING_EVENTS.BITE_DOWNLOADED, {
            biteId: bite.id,
            sourceType: source.type,
          });
        },
      }))}
    />
  );
};
