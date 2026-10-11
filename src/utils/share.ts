import { Platform, Share } from "react-native";
import { isDesktop } from "./device";
import { copyAsText } from "./clipboard";
import { toast } from "@/components/Toast";

export const shareUrl = (url: string, title?: string) => {
  if (isDesktop) {
    copyAsText(url)
      .then(() => toast({ message: "Link copied to clipboard" }))
      .catch(() => toast({ message: "Failed to copy link" }));
    return;
  }

  Share.share(
    Platform.select({
      ios: { url },
      android: {
        title,
        message: url,
      },
      default: {
        message: url,
      },
    }),
  ).catch(() => undefined);
};
