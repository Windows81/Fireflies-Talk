import { useAuth } from "@/features/auth/store";
import {
  applyMeetingTitleRename,
  revertMeetingTitleRename,
} from "@/features/meeting";
import { useUpdateMeetingTitleMutation } from "@/graphql";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNotepadTitle, isMeetingOwner } from "../helpers/meeting";
import type { DesktopNotepadMeeting } from "../types";

export interface NotepadTitleState {
  canEdit: boolean;
  value: string;
  onChange: (value: string) => void;
  commit: () => void;
  displayTitle: string;
}

export function useNotepadTitle(
  meeting: DesktopNotepadMeeting,
): NotepadTitleState {
  const { user } = useAuth();
  const canEdit = isMeetingOwner(meeting, user);

  const dbTitle = meeting.title?.trim() ?? "";
  // Title-less meetings fall back to the generated start date/time title, so the
  // field always reads as a title instead of being blank.
  const displayValue = dbTitle || getNotepadTitle(meeting);
  const [value, setValue] = useState(displayValue);
  const dirtyRef = useRef(false);
  const userNamedRef = useRef(false);
  // The most recently submitted title, so a stale failed rename doesn't revert
  // local state that a newer rename already moved on from.
  const latestAttemptRef = useRef<string | null>(null);

  const [updateMeetingTitle] = useUpdateMeetingTitleMutation();

  // Follow the DB title unless the user is mid-edit or has already renamed it.
  useEffect(() => {
    if (!dirtyRef.current && !userNamedRef.current) setValue(displayValue);
  }, [displayValue]);

  const onChange = useCallback((next: string) => {
    setValue(next);
    dirtyRef.current = true;
  }, []);

  const commit = useCallback(() => {
    dirtyRef.current = false;
    const trimmed = value.trim();
    // No real change — empty, unchanged, or still the generated fallback title.
    const isFallback = !dbTitle && trimmed === getNotepadTitle(meeting);
    if (!trimmed || trimmed === dbTitle || isFallback) {
      setValue(displayValue);
      return;
    }
    const previousTitle = meeting.title ?? "";
    userNamedRef.current = true;
    latestAttemptRef.current = trimmed;
    setValue(trimmed);
    applyMeetingTitleRename(meeting.id, trimmed);
    updateMeetingTitle({
      variables: { meetingId: meeting.id, title: trimmed },
      // Roll the optimistic title back if the save fails, so we don't keep
      // showing (and masking later server titles with) a name never persisted.
      onError(error) {
        revertMeetingTitleRename(meeting.id, trimmed, previousTitle, error);
        // Only reset local state if this is still the latest rename attempt and
        // the user isn't editing again, so a late failure can't clobber a newer
        // rename or the text being typed.
        if (latestAttemptRef.current !== trimmed || dirtyRef.current) return;
        userNamedRef.current = false;
        setValue(displayValue);
      },
    });
  }, [value, dbTitle, displayValue, meeting, updateMeetingTitle]);

  return {
    canEdit,
    value,
    onChange,
    commit,
    displayTitle: getNotepadTitle(meeting),
  };
}
