import { markdownItInstance } from "./instance";

export const markdownToHtml = (markdown: string) => {
  return markdownItInstance.render(markdown);
};
