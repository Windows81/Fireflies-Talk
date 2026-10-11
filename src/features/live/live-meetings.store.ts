// The single owner of "the live meetings list": one shared Apollo watchQuery,
// the reconciled (filtered + sorted) list, the loading flag, and the optimistic
// `ended` overlay (meetings ended locally, dropped from the list ahead of the
// next refetch). Cross-platform — every reader (mobile + desktop) uses this.
// Notification logic lives in the desktop-only live-meeting-notifier, not here.
import { create } from "zustand";
import type { ObservableQuery } from "@apollo/client";
import type { Subscription } from "zen-observable-ts";
import { apolloClient } from "@/graphql";
import {
  GetLiveMeetingsDocument,
  type GetLiveMeetingsQuery,
  type MeetingStatusData,
} from "@/graphql";

interface LiveMeetingsState {
  meetings: MeetingStatusData[]; // live && !hidden, sorted by startTime
  loading: boolean;
}

export const useLiveMeetingsStore = create<LiveMeetingsState>(() => ({
  meetings: [],
  loading: true,
}));

// --- module-local, non-reactive ownership ---------------------------------
const endedIds = new Set<string>();
// Optimistic titles for locally-renamed meetings, re-applied in publish() so a
// stale poll (which lands before the server persists the rename) can't briefly
// revert the title. Cleared per-meeting once the server snapshot catches up.
const renamedTitles = new Map<string, string>();
let rawMeetings: MeetingStatusData[] = [];
let loading = true;

let observable: ObservableQuery<GetLiveMeetingsQuery> | null = null;
let subscription: Subscription | null = null;

// Each acquirePoll() caller contributes a desired interval; we poll at the min.
const pollSubscribers = new Set<{ pollInterval: number; skip: boolean }>();

function extractMeetings(data?: GetLiveMeetingsQuery): MeetingStatusData[] {
  return (data?.liveMeetings?.meetings ?? []).filter(
    (m): m is MeetingStatusData => Boolean(m),
  );
}

// Drop optimistic title overlays that are no longer needed after a snapshot:
// once the server echoes the rename we follow the server (incl. later AI
// auto-titles), and once a meeting leaves the live list its overlay can't be
// reconciled and would otherwise mask the title forever if it reappears.
function reconcileRenamedTitles(): void {
  if (renamedTitles.size === 0) return;
  const present = new Set<string>();
  rawMeetings.forEach((m) => {
    if (!m.objectId) return;
    present.add(m.objectId);
    if (renamedTitles.get(m.objectId) === m.title)
      renamedTitles.delete(m.objectId);
  });
  // Don't evict on an empty snapshot: a transient loading emission (data
  // undefined) yields an empty list, and dropping overlays there would let a
  // later stale poll revert the banner — the flip-back these overlays prevent.
  if (present.size === 0) return;
  renamedTitles.forEach((_title, id) => {
    if (!present.has(id)) renamedTitles.delete(id);
  });
}

// Push the current raw snapshot (minus locally-ended) into the reactive store.
function publish(): void {
  const meetings = rawMeetings
    .filter((m) => m?.objectId && !endedIds.has(m.objectId))
    .map((m) => {
      const title = m.objectId ? renamedTitles.get(m.objectId) : undefined;
      return title !== undefined ? { ...m, title } : m;
    })
    .sort((a, b) =>
      a?.startTime && b?.startTime ? a.startTime - b.startTime : 0,
    );
  useLiveMeetingsStore.setState({ meetings, loading });
}

function ensureObservable(): void {
  if (observable) return;
  observable = apolloClient.watchQuery<GetLiveMeetingsQuery>({
    query: GetLiveMeetingsDocument,
    fetchPolicy: "network-only",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
  });
  subscription = observable.subscribe({
    next: (result) => {
      loading = result.loading;
      rawMeetings = extractMeetings(result.data);
      reconcileRenamedTitles();
      publish();
    },
    error: (error) => {
      console.error("[live-meetings.store] subscription error", error);
      // Network errors end an ObservableQuery even with errorPolicy "all".
      // Drop it so the next refetch starts a fresh watch.
      subscription = null;
      observable = null;
    },
  });
}

function hasActiveSubscriber(): boolean {
  return [...pollSubscribers].some((meta) => !meta.skip);
}

function recomputePolling(): void {
  if (!observable) return;
  let desired: number | null = null;
  let hasActive = false;
  pollSubscribers.forEach((meta) => {
    if (meta.skip) return;
    hasActive = true;
    if (meta.pollInterval > 0) {
      desired =
        desired === null
          ? meta.pollInterval
          : Math.min(desired, meta.pollInterval);
    }
  });
  if (!hasActive || !desired) {
    observable.stopPolling();
    return;
  }
  observable.startPolling(desired);
}

function teardownIfIdle(): void {
  if (pollSubscribers.size > 0) {
    recomputePolling();
    return;
  }
  subscription?.unsubscribe();
  subscription = null;
  observable?.stopPolling();
  observable = null;
  // Drop the cached snapshot so a remount / new session (e.g. after logout)
  // starts empty instead of flashing the previous session's live meetings.
  rawMeetings = [];
  endedIds.clear();
  renamedTitles.clear();
  loading = true;
  publish();
}

export const liveMeetingsApi = {
  refetch: async () => {
    if (!observable && hasActiveSubscriber()) {
      ensureObservable();
      recomputePolling();
    }
    if (observable) return observable.refetch();
    // No active watch (e.g. only skipped subscribers): query directly, but
    // still push the result into the store so readers don't stay stale.
    const result = await apolloClient.query({
      query: GetLiveMeetingsDocument,
      fetchPolicy: "network-only",
    });
    loading = false;
    rawMeetings = extractMeetings(result.data);
    reconcileRenamedTitles();
    publish();
    return result;
  },

  // A meeting ended (manual end or auto end-detection): drop it from the live
  // list immediately, ahead of the next server refetch.
  markEnded: (id: string) => {
    endedIds.add(id);
    publish();
  },

  // Meeting was renamed: hold the new title as an optimistic overlay so
  // surfaces like the homepage banner update immediately and don't revert on a
  // stale poll. Cleared once the server snapshot catches up (see subscribe).
  updateTitle: (meetingId: string, title: string) => {
    renamedTitles.set(meetingId, title);
    publish();
  },

  // Rename failed to persist: drop the optimistic overlay so the list follows
  // the server again instead of showing a title that was never saved. When
  // `expectedTitle` is given, only clear if the overlay still holds it, so a
  // stale failure can't wipe a newer rename's overlay.
  clearTitleOverride: (meetingId: string, expectedTitle?: string) => {
    if (
      expectedTitle !== undefined &&
      renamedTitles.get(meetingId) !== expectedTitle
    )
      return;
    if (renamedTitles.delete(meetingId)) publish();
  },

  /** Ref-counted poll subscription. Returns an unsubscribe fn. */
  acquirePoll: (meta: { pollInterval: number; skip: boolean }) => {
    if (!meta.skip) ensureObservable();
    pollSubscribers.add(meta);
    publish();
    recomputePolling();
    return () => {
      pollSubscribers.delete(meta);
      teardownIfIdle();
    };
  },
};
