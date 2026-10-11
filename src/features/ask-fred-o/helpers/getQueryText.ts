import type { ThreadMessageQueryPart } from "@firefliesai/fred-client";

export const getQueryText = (
  parts: ThreadMessageQueryPart[] | undefined,
): string =>
  (parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
