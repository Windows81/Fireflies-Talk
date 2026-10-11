import * as Clipboard from "expo-clipboard";
import { Platform } from "react-native";

const htmlToPlainText = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent ?? "";
};

export const copyAsHtml = (text: string) => {
  const html = Platform.OS === "ios" ? `<meta charset="utf-8">${text}` : text;
  // Desktop: expo-clipboard's web implementation can report success without
  // actually writing, so use Electron's native clipboard instead.
  const electronClipboard = window?.electron?.clipboard;
  if (electronClipboard) {
    return electronClipboard
      .writeHtml(html, htmlToPlainText(html))
      .then(() => true);
  }
  return Clipboard.setStringAsync(html, {
    inputFormat: Clipboard.StringFormat.HTML,
  });
};

export const copyAsText = (text: string) => {
  // Desktop: expo-clipboard's web implementation can report success without
  // actually writing, so use Electron's native clipboard instead.
  const electronClipboard = window?.electron?.clipboard;
  if (electronClipboard) {
    return electronClipboard.writeText(text).then(() => true);
  }
  return Clipboard.setStringAsync(text);
};

export const copyAsMarkdown = (text: string) => {
  const electronClipboard = window?.electron?.clipboard;
  if (electronClipboard?.writeMarkdown) {
    return electronClipboard.writeMarkdown(text).then(() => true);
  }
  return copyAsText(text);
};
