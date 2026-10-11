type PendingFinalization = {
  meetingId?: string;
  completion: Promise<void>;
};

type PendingFinalizationSnapshot = {
  meetingId?: string;
};

type StopRequest = {
  requestedMeetingId?: string;
  activeMeetingId?: string;
  isActive: boolean;
  stop: () => Promise<unknown>;
  notifyCompleted: (stopped: boolean) => void;
};

const settleAll = (completions: Promise<void>[]): Promise<void> =>
  Promise.allSettled(completions).then((results) => {
    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failed.length) {
      throw failed[0].reason;
    }
  });

export function createRecordingFinalizationTracker(
  onPendingChange: (
    pending: PendingFinalizationSnapshot | null,
  ) => void = () => {},
) {
  const pending = new Set<PendingFinalization>();
  const getPendingFinalization = (): PendingFinalizationSnapshot | null =>
    pending.size
      ? { meetingId: pending.values().next().value?.meetingId }
      : null;
  const notifyPendingChange = () => onPendingChange(getPendingFinalization());

  const track = <T>(promise: Promise<T>, meetingId?: string): Promise<T> => {
    const completion = promise.then(() => undefined);
    const finalization = { meetingId, completion };
    pending.add(finalization);
    notifyPendingChange();
    void completion.catch(() => undefined);
    void completion.then(
      () => {
        if (pending.delete(finalization)) {
          notifyPendingChange();
        }
      },
      () => {
        if (pending.delete(finalization)) {
          notifyPendingChange();
        }
      },
    );
    return promise;
  };

  const handleStopRequest = ({
    requestedMeetingId,
    activeMeetingId,
    isActive,
    stop,
    notifyCompleted,
  }: StopRequest): void => {
    const notifyWhenSettled = (completion: Promise<unknown>) => {
      void completion.then(
        () => notifyCompleted(true),
        () => notifyCompleted(false),
      );
    };
    const matchesActiveRecording =
      isActive &&
      (!requestedMeetingId || activeMeetingId === requestedMeetingId);
    const matchingFinalizations = [...pending].filter(
      (finalization) =>
        !requestedMeetingId || finalization.meetingId === requestedMeetingId,
    );

    if (matchesActiveRecording) {
      const activeFinalization = matchingFinalizations.find(
        (finalization) => finalization.meetingId === activeMeetingId,
      );
      if (activeFinalization) {
        notifyWhenSettled(activeFinalization.completion);
        return;
      }
      notifyWhenSettled(stop());
      return;
    }
    if (matchingFinalizations.length) {
      notifyWhenSettled(
        settleAll(
          matchingFinalizations.map((finalization) => finalization.completion),
        ),
      );
      return;
    }
    notifyCompleted(false);
  };

  return { track, handleStopRequest, getPendingFinalization };
}
