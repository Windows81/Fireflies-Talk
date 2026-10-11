import { toast } from "@/components/Toast";
import { copyAsHtml, copyAsText } from "@/utils/clipboard";
import type { RefObject } from "react";
import type { View } from "react-native";

export const markdownify = (text: string) => {
  // A text newline is \n, a markdown paragraph break is \n\n.
  // Double all newlines, then collapse back between table rows so tables render correctly.
  return text
    .split("\n")
    .join("\n\n")
    .replace(/(\|[ \t]*\n)\n(\|)/g, "$1$2");
};

export const copyText = (
  text: string,
  isHtml?: boolean,
  containerRef?: RefObject<View | null>,
) => {
  (isHtml ? copyAsHtml : copyAsText)(text).then(
    () => {
      toast({
        message: "Copied to clipboard",
        containerRef,
      });
    },
    (error) => {
      toast({
        title: "Failed to copy",
        message: error.message,
        type: "error",
        containerRef,
      });
    },
  );
};
