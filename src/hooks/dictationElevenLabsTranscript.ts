/**
 * Scribe auto-commits after ~36s of audio and clears that segment.
 * Keep every non-empty committed segment so long holds don't drop earlier speech.
 */
export function recordCommittedTranscriptSegment(
  segments: string[],
  text: string,
): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  segments.push(trimmed);
}

export function joinCommittedTranscriptSegments(segments: string[]): string {
  return segments.join(" ");
}
