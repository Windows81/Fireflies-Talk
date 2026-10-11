import {
  DICTATION_ABORT_REASONS,
  type DictationAbortReason,
} from "./dictationWorkGate";

export function getAskFredJobCancelUrl(
  proxyUrl: string,
  jobId: string,
): string {
  const origin = new URL(proxyUrl).origin;
  return `${origin}/api/jobs/${encodeURIComponent(jobId)}/cancel`;
}

export function jobIdFromFredEvent(event: unknown): string | undefined {
  if (!event || typeof event !== "object") return undefined;
  const record = event as { type?: unknown; jobId?: unknown };
  if (record.type !== "job.created") return undefined;
  return typeof record.jobId === "string" && record.jobId
    ? record.jobId
    : undefined;
}

export async function cancelAskFredJob(
  cancelUrl: string,
  accessToken: string,
  reason: DictationAbortReason = "client-abort",
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!accessToken) return;
  await fetchImpl(cancelUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: "talk-action-mode", reason }),
  });
}

export function watchAskFredJobCancel(options: {
  signal?: AbortSignal;
  cancelJob: (jobId: string, reason: DictationAbortReason) => Promise<void>;
}): {
  onJobCreated: (jobId: string) => void;
  flush: () => Promise<void>;
} {
  let jobId: string | undefined;
  let cancelRequested = options.signal?.aborted === true;
  let cancelReason: DictationAbortReason = "client-abort";
  let inFlight: Promise<void> | undefined;

  const getAbortReason = (): DictationAbortReason => {
    const reason = options.signal?.reason;
    const message =
      reason instanceof DOMException && reason.name === "AbortError"
        ? reason.message
        : undefined;
    return (
      DICTATION_ABORT_REASONS.find((validReason) => validReason === message) ??
      "client-abort"
    );
  };

  const startCancel = (id: string) => {
    if (inFlight) return;
    inFlight = options.cancelJob(id, cancelReason).catch(() => undefined);
  };

  const onAbort = () => {
    cancelRequested = true;
    cancelReason = getAbortReason();
    if (jobId) startCancel(jobId);
  };

  if (cancelRequested) cancelReason = getAbortReason();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  return {
    onJobCreated: (id) => {
      jobId = id;
      if (cancelRequested) startCancel(id);
    },
    flush: async () => {
      options.signal?.removeEventListener("abort", onAbort);
      if (cancelRequested && jobId) startCancel(jobId);
      await inFlight;
    },
  };
}
