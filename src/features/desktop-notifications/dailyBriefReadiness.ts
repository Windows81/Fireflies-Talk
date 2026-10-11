/**
 * Whether the daily brief was generated on the same local calendar day as
 * `now`. The `lastOutputCreatedAt` GraphQL scalar is untyped on the wire, so
 * accept anything Date can parse (ISO string or epoch millis).
 */
export function isBriefCreatedToday(
  lastOutputCreatedAt: unknown,
  now: Date = new Date(),
): boolean {
  if (
    typeof lastOutputCreatedAt !== "string" &&
    typeof lastOutputCreatedAt !== "number"
  ) {
    return false;
  }

  const createdAt = new Date(lastOutputCreatedAt);
  if (Number.isNaN(createdAt.getTime())) return false;

  return (
    createdAt.getFullYear() === now.getFullYear() &&
    createdAt.getMonth() === now.getMonth() &&
    createdAt.getDate() === now.getDate()
  );
}
