import {
  applyMeetingTitleRename,
  revertMeetingTitleRename,
} from "@/features/meeting";
import { useUpdateMeetingTitleMutation, type Meeting } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useCallback, useEffect, useRef, useState } from "react";

// Window during which we hold the user's just-submitted title while it
// roundtrips through the backend, so a stale refetch can't briefly show the old
// title. The lasting guarantee lives in userNamedRef: once the user names the
// meeting we never adopt meeting.title again, so an AI auto-title can't replace
// it even after this window elapses.
const PENDING_TITLE_LOCK_TIMEOUT_MS = 15_000;

export interface MeetingHeaderState {
  title: string;
  isEditing: boolean;
  beginEdit: () => void;
  draft: string;
  setDraft: (value: string) => void;
  commit: () => void;
  cancel: () => void;
}

export const useMeetingHeader = (meeting: Meeting): MeetingHeaderState => {
  const meetingTitle = meeting.title || "";

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(meetingTitle);
  const [title, setTitle] = useState(meetingTitle);

  const pendingSubmittedTitleRef = useRef<string | null>(null);
  // The most recently submitted title. Unlike pendingSubmittedTitleRef (which
  // the sync effect clears as soon as the optimistic cache write lands), this
  // is only overwritten by a newer commit, so a failed rename can tell whether
  // it is still the latest attempt before rolling local state back.
  const latestAttemptRef = useRef<string | null>(null);
  const pendingTitleLockTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const latestMeetingTitleRef = useRef(meetingTitle);
  // Mirrors isEditing so an async mutation callback can tell whether the user is
  // editing again without a stale closure over the isEditing state.
  const isEditingRef = useRef(false);
  // Once the user names the meeting, an AI-generated title must never replace it.
  const userNamedRef = useRef(false);

  const clearPendingTitleLockTimeout = useCallback(() => {
    if (pendingTitleLockTimeoutRef.current) {
      clearTimeout(pendingTitleLockTimeoutRef.current);
      pendingTitleLockTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestMeetingTitleRef.current = meetingTitle;
  }, [meetingTitle]);

  // Sync the displayed title from the meeting unless we are mid-edit or waiting
  // for a submitted title to roundtrip through the backend.
  useEffect(() => {
    const pendingTitle = pendingSubmittedTitleRef.current;

    if (pendingTitle) {
      if (meetingTitle === pendingTitle) {
        clearPendingTitleLockTimeout();
        pendingSubmittedTitleRef.current = null;
        setTitle(meetingTitle);
      }
      return;
    }

    if (!isEditing && !userNamedRef.current) {
      setTitle(meetingTitle);
    }
  }, [meetingTitle, isEditing, clearPendingTitleLockTimeout]);

  useEffect(() => clearPendingTitleLockTimeout, [clearPendingTitleLockTimeout]);

  const [updateMeetingTitle] = useUpdateMeetingTitleMutation();

  const beginEdit = useCallback(() => {
    setDraft(title);
    isEditingRef.current = true;
    setIsEditing(true);
  }, [title]);

  const cancel = useCallback(() => {
    setDraft(title);
    isEditingRef.current = false;
    setIsEditing(false);
  }, [title]);

  const commit = useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
    const trimmed = draft.trim();
    const currentTitle = latestMeetingTitleRef.current;

    if (!trimmed.length || trimmed === currentTitle) {
      setDraft(currentTitle);
      setTitle(currentTitle);
      return;
    }

    userNamedRef.current = true;
    pendingSubmittedTitleRef.current = trimmed;
    latestAttemptRef.current = trimmed;
    setTitle(trimmed);
    setDraft(trimmed);

    applyMeetingTitleRename(meeting.id, trimmed);
    clearPendingTitleLockTimeout();
    // If the submitted title never roundtrips, just release the optimistic lock
    // and keep the user's title — never fall back to meeting.title, which by
    // then could hold an AI-generated auto-title.
    pendingTitleLockTimeoutRef.current = setTimeout(() => {
      if (pendingSubmittedTitleRef.current !== trimmed) return;
      pendingSubmittedTitleRef.current = null;
    }, PENDING_TITLE_LOCK_TIMEOUT_MS);

    updateMeetingTitle({
      variables: { meetingId: meeting.id, title: trimmed },
      // Roll the optimistic title back if the save fails, so we don't keep
      // showing (and masking later server titles with) a name never persisted.
      onError(error) {
        revertMeetingTitleRename(meeting.id, trimmed, currentTitle, error);
        // Only reset local state if this is still the latest rename attempt and
        // the user isn't editing again, so a late failure can't clobber a newer
        // rename or the text being typed. Use latestAttemptRef, not
        // pendingSubmittedTitleRef (cleared by the sync effect on the cache write).
        if (latestAttemptRef.current !== trimmed || isEditingRef.current)
          return;
        userNamedRef.current = false;
        pendingSubmittedTitleRef.current = null;
        clearPendingTitleLockTimeout();
        setTitle(currentTitle);
        setDraft(currentTitle);
      },
    });
    tracker.track(TRACKING_EVENTS.CALL_RECORD_TITLE_EDITED, {
      meetingId: meeting.id,
      source: "realtime_panel",
    });
  }, [draft, meeting.id, updateMeetingTitle, clearPendingTitleLockTimeout]);

  return {
    title,
    isEditing,
    beginEdit,
    draft,
    setDraft,
    commit,
    cancel,
  };
};
