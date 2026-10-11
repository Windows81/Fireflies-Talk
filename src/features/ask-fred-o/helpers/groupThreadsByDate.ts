import type { Thread } from "@firefliesai/fred-client";
import { differenceInCalendarDays } from "date-fns";

export interface ThreadGroup {
  title: string;
  threads: Thread[];
}

const BUCKETS = [
  { title: "Today", maxDays: 0 },
  { title: "Previous 7 days", maxDays: 7 },
  { title: "Previous 30 days", maxDays: 30 },
  { title: "Older", maxDays: Number.POSITIVE_INFINITY },
];

const lastActivityAt = (thread: Thread): string =>
  thread.updatedAt ?? thread.createdAt;

export const groupThreadsByDate = (
  threads: Thread[] | undefined,
  now: Date,
): ThreadGroup[] => {
  const visible = (threads ?? []).filter((thread) => !thread.archivedAt);
  if (!visible.length) return [];

  const sorted = [...visible].sort(
    (a, b) =>
      new Date(lastActivityAt(b)).getTime() -
      new Date(lastActivityAt(a)).getTime(),
  );

  const byTitle = new Map<string, Thread[]>();

  for (const thread of sorted) {
    const age = differenceInCalendarDays(now, new Date(lastActivityAt(thread)));
    const bucket =
      BUCKETS.find((candidate) => age <= candidate.maxDays) ??
      BUCKETS[BUCKETS.length - 1];
    const existing = byTitle.get(bucket.title);
    if (existing) existing.push(thread);
    else byTitle.set(bucket.title, [thread]);
  }

  return BUCKETS.filter((bucket) => byTitle.has(bucket.title)).map(
    (bucket) => ({
      title: bucket.title,
      threads: byTitle.get(bucket.title) ?? [],
    }),
  );
};
