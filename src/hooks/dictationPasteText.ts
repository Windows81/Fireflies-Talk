export function resolveDictatedPasteText(args: {
  rawText: string;
  cleanedText?: string;
}): { text: string; needsClientFormat: boolean } {
  const cleaned = args.cleanedText?.trim();
  if (cleaned) {
    return { text: cleaned, needsClientFormat: false };
  }
  return { text: args.rawText, needsClientFormat: true };
}
