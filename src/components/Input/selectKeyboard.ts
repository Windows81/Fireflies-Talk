export type SelectKeyboardAction =
  | { type: "highlight"; index: number }
  | { type: "select" }
  | { type: "close" }
  | { type: "none" };

export function nextSelectHighlightIndex(
  current: number,
  delta: number,
  count: number,
): number {
  if (count <= 0) return 0;
  return (current + delta + count) % count;
}

export function selectHighlightIndexForKey(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count <= 0) return null;
  switch (key) {
    case "ArrowDown":
      return nextSelectHighlightIndex(current, 1, count);
    case "ArrowUp":
      return nextSelectHighlightIndex(current, -1, count);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

export function selectKeyboardAction(
  key: string,
  current: number,
  count: number,
): SelectKeyboardAction {
  const index = selectHighlightIndexForKey(key, current, count);
  if (index != null) return { type: "highlight", index };
  if (key === "Enter") return { type: "select" };
  if (key === "Escape") return { type: "close" };
  return { type: "none" };
}

export function keyFromKeyboardEvent(event: {
  key?: string;
  nativeEvent?: { key?: string };
}): string {
  return event.key ?? event.nativeEvent?.key ?? "";
}
