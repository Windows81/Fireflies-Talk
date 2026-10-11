import type { LinkViewProps } from "./types";

export const createTo = (href: NonNullable<LinkViewProps["href"]>) => {
  return typeof href === "string"
    ? { screen: href }
    : {
        screen: href.pathname,
        params: href.params,
      };
};
