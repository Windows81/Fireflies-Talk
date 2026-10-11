/**
 * Whether the hover the main process reports still counts. A session finished
 * by a click on the pill leaves the cursor on it, and the moment the settle
 * let go the launcher would pop open over a pill that has just gone quiet. The
 * hover goes stale when a settle starts under it and only a fresh one — the
 * cursor leaving and coming back — counts again.
 */
export function resolveStaleHover(
  stale: boolean,
  isHovered: boolean,
  settling: boolean,
): boolean {
  if (!isHovered) return false;
  return stale || settling;
}
