import { Dialog } from "@/components/Dialog";
import { captureException } from "@/errors";
import { Logger } from "@/logger";
import * as ShareTarget from "@/modules/share-target";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TRACKING_EVENTS, tracker } from "../../tracking";
import { ShareTargetNotSupported } from "./ShareTargetNotSupported";
import { ShareTargetUploadableMedia } from "./ShareTargetUploadableMedia";
import { formatShareData } from "./utils";

const logger = new Logger("share-target");

export const ShareTargetComponent: FC = () => {
  const [sharedData, setSharedData] = useState<ShareTarget.ShareData | null>(
    null,
  );

  const [isOpen, open, _close] = useBooleanState();

  const close = useCallback(() => {
    setSharedData(null);
    _close();
  }, [_close]);

  useEffect(() => {
    ShareTarget.getInitialShare()
      .then((data) => {
        if (data) {
          tracker.track(TRACKING_EVENTS.FILE_SHARED_TO_FIREFLIES, data);
          const formattedData = formatShareData(data);
          logger.info("initial share data", formattedData);
          setSharedData(formattedData);
          open();
        } else {
          setSharedData(null);
        }
      })
      .catch((err) => {
        captureException(err, {
          tags: {
            section: "share-target",
          },
        });
      });

    const sub = ShareTarget.addShareListener((data) => {
      if (data) {
        logger.info("on share data", data);
        tracker.track(TRACKING_EVENTS.FILE_SHARED_TO_FIREFLIES, data);
        const formattedData = formatShareData(data);
        setSharedData(formattedData);
        open();
      } else {
        setSharedData(null);
      }
    });

    return () => sub.remove();
  }, [open]);

  const contentNode = useMemo(() => {
    if (!sharedData) return null;

    const file = sharedData.files?.[0];

    if (file) {
      if (file.type?.startsWith("audio/") || file.type?.startsWith("video/")) {
        return <ShareTargetUploadableMedia file={file} close={close} />;
      }
    }

    return <ShareTargetNotSupported sharedData={sharedData} close={close} />;
  }, [sharedData, close]);

  return (
    <>
      <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
        {contentNode}
      </Dialog.Root>
    </>
  );
};
