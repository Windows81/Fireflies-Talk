import { UPLOAD_CLIENT_KEYS } from "@/features/upload";
import { apolloClient } from "@/graphql";
import { Logger } from "@/logger";
import type {
  ClientConsentChannel,
  ClientConsentOutcome,
} from "@firefliesai/mobile-ff.graphql-client";
import { RecordConsentNoticeDocument } from "@firefliesai/mobile-ff.graphql-client";

const log = new Logger("ConsentNotice");

/**
 * Meetings already accounted for, per channel. Module state rather than a ref
 * because the desktop home screen — where the notifiers are mounted — is
 * mounted several times over, and each copy would otherwise file its own row.
 */
const reported = new Set<string>();

interface ConsentNoticeReport {
  meetingId: string;
  channel: ClientConsentChannel;
  outcome: ClientConsentOutcome;
  /** Machine-readable cause, for a notice that was attempted and failed. */
  reason?: string;
  /** What participants saw or heard, as this build rendered it. */
  noticeBody?: string;
}

/**
 * Files one record of a notice this app delivered itself, so the recording can
 * be accounted for afterwards. The server cannot observe the spoken message
 * sent through speakers, the badge composited into the camera feed, or the
 * keyboard-delivered Google Meet and Zoom chat notice. Teams provider delivery
 * is observed and recorded server-side instead.
 *
 * Once per meeting per channel, and never throws — an unfiled record must not
 * disturb a recording in progress.
 */
export async function reportConsentNotice({
  meetingId,
  channel,
  outcome,
  reason,
  noticeBody,
}: ConsentNoticeReport): Promise<void> {
  const key = `${meetingId}:${channel}`;
  if (reported.has(key)) return;
  reported.add(key);

  try {
    await apolloClient.mutate({
      mutation: RecordConsentNoticeDocument,
      variables: {
        input: {
          meetingId,
          channel,
          outcome,
          source: UPLOAD_CLIENT_KEYS.DESKTOP_RECORD,
          correlationId: globalThis.crypto.randomUUID(),
          ...(reason && { reason }),
          ...(noticeBody && { noticeBody }),
        },
      },
    });
    log.info("Consent notice recorded", { meetingId, channel, outcome });
  } catch (error) {
    // Let a later recording try again rather than leaving this one silently
    // unaccounted for.
    reported.delete(key);
    log.warn("Could not record consent notice", {
      meetingId,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
