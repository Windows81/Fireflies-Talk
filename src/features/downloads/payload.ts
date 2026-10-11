import { isForbiddenError, isNotFoundError } from "@/errors";
import { useAuth } from "@/features/auth";
import { apolloClient } from "@/graphql";
import { Logger } from "@/logger";
import {
  GetSoundbitesDocument,
  type GetSoundbitesQuery,
} from "@firefliesai/bites-ff.graphql-client";
import {
  GetMeetingDocument,
  GetMeetingSummaryQueryDocument,
  type GetMeetingQuery,
  type GetMeetingSummaryQueryQuery,
} from "@firefliesai/mobile-ff.graphql-client";
import { deleteDownload } from "./cleanup";
import type { DownloadPayload } from "./fs";
import { dirSizeBytes, writePayload } from "./fs";
import { downloadsApi, useDownloads } from "./store";
import { DownloadStatus } from "./types";

const logger = new Logger("offline-meeting-payload");

const SILENT_NETWORK_ONLY = {
  fetchPolicy: "network-only" as const,
  context: { silentErrors: true },
};

export type PayloadFetchResult =
  | { ok: true; payload: DownloadPayload }
  | { ok: false; reason: "revoked" };

/**
 * Fetches everything payload.json holds. Returns `revoked` when the server
 * answers forbidden/not-found (or a null meeting with no error) — access is
 * gone and the local download must be deleted. Network/transport failures
 * throw so callers can retry.
 */
export async function fetchMeetingPayload(
  meetingId: string,
): Promise<PayloadFetchResult> {
  const result = await apolloClient.query<GetMeetingQuery>({
    query: GetMeetingDocument,
    variables: { id: meetingId },
    ...SILENT_NETWORK_ONLY,
  });

  const meeting = result.data?.meeting;
  if (!meeting) {
    const [error] = result.errors ?? [];
    if (!error || isForbiddenError(error) || isNotFoundError(error)) {
      return { ok: false, reason: "revoked" };
    }
    throw new Error(`GetMeeting failed: ${error.message}`);
  }

  // Summary and soundbites are best-effort — a meeting without them still
  // works offline (transcript + metadata).
  const [summary, soundbites] = await Promise.all([
    apolloClient
      .query<GetMeetingSummaryQueryQuery>({
        query: GetMeetingSummaryQueryDocument,
        variables: { meetingId },
        ...SILENT_NETWORK_ONLY,
      })
      .then((r) => r.data?.meetingSummary ?? null)
      .catch(() => null),
    apolloClient
      .query<GetSoundbitesQuery>({
        query: GetSoundbitesDocument,
        variables: { meetingId },
        ...SILENT_NETWORK_ONLY,
      })
      .then((r) => r.data?.soundbites ?? null)
      .catch(() => null),
  ]);

  return {
    ok: true,
    payload: { meeting, summary, soundbites, savedAt: Date.now() },
  };
}

/**
 * Re-fetches payload.json for every complete download so title edits, speaker
 * renames and new soundbites reach the offline copies (hardening #2). Media is
 * never re-downloaded. Revoked meetings are deleted (hardening #1).
 *
 * Owner-scoped: probing another account's meeting with this session's
 * permissions would answer forbidden and wrongly delete their download.
 */
export async function refreshDownloadedPayloads() {
  const userId = useAuth.getState().user?.id;
  for (const entry of useDownloads.getState().index) {
    if (entry.userId !== userId) continue;
    if (entry.status.state === DownloadStatus.COMPLETE) {
      try {
        const result = await fetchMeetingPayload(entry.meetingId);
        if (result.ok) {
          await writePayload(entry.meetingId, result.payload);
          downloadsApi.upsert({
            ...entry,
            status: {
              ...entry.status,
              sizeBytes: dirSizeBytes(entry.meetingId),
            },
          });
        } else {
          logger.info("access revoked. deleting download", {
            meetingId: entry.meetingId,
          });
          deleteDownload(entry.meetingId);
        }
      } catch (error) {
        logger.warn("payload refresh failed", {
          meetingId: entry.meetingId,
          error,
        });
      }
    }
  }
}
