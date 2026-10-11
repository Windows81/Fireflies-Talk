import {
  EnumTaskOwnerType,
  EnumTaskStatus,
  type CoreFeedMeetingFieldsFragment,
} from "@/graphql";
import { isEmail } from "@/utils/email";
import { getNameParts } from "@/utils/user";

export type NotepadTaskItem = CoreFeedMeetingFieldsFragment["tasks"][number];

export interface NotepadParticipant {
  name: string | null;
  email: string;
  picture: string | null;
}

export const isTaskCompleted = (task: NotepadTaskItem): boolean =>
  task.status === EnumTaskStatus.Completed || !!task.completedAt;

// Organizer first, then participants, de-duplicated by email.
export const getMeetingParticipants = (
  meeting: CoreFeedMeetingFieldsFragment | null,
): NotepadParticipant[] => {
  if (!meeting) return [];
  const seen = new Set<string>();
  const result: NotepadParticipant[] = [];
  for (const profile of [
    meeting.organizerProfile,
    ...(meeting.participantsProfiles ?? []),
  ]) {
    const email = profile?.email?.toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push({
      name: profile?.name ?? null,
      email: profile?.email ?? email,
      picture: profile?.picture ?? null,
    });
  }
  return result;
};

// Lower-cased email of the current owner, used to match the selected participant.
export const getTaskOwnerEmail = (task: NotepadTaskItem): string | null => {
  if (task.ownerProfile?.__typename === "Profile" && task.ownerProfile.email) {
    return task.ownerProfile.email.toLowerCase();
  }
  return task.ownerEmail?.toLowerCase() ?? null;
};

export const isTaskAssignedToUser = (
  task: NotepadTaskItem,
  user: { id?: string; notebookId?: string; email?: string } | null,
): boolean => {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  const profileEmail =
    task.ownerProfile?.__typename === "Profile"
      ? task.ownerProfile.email?.toLowerCase()
      : undefined;
  if (
    email &&
    (task.ownerEmail?.toLowerCase() === email || profileEmail === email)
  )
    return true;
  return (
    !!task.ownerId &&
    (task.ownerId === user.id || task.ownerId === user.notebookId)
  );
};

// A task is editable/assignable when the user is the meeting owner, or the task
// isn't already assigned to another individual (unassigned, assigned-to-you, or
// assigned-to-a-group are editable). Generated owner names don't count.
export const canModifyTask = (
  task: NotepadTaskItem,
  user: { id?: string; notebookId?: string; email?: string } | null,
  isMeetingOwner: boolean,
): boolean => {
  if (isMeetingOwner) return true;
  if (task.ownerType === EnumTaskOwnerType.UserGroup) return true;
  const hasOwner = !!task.ownerEmail || !!task.ownerId || !!task.ownerProfile;
  if (!hasOwner) return true;
  return isTaskAssignedToUser(task, user);
};

export const getDisplayName = (
  name?: string | null,
  email?: string | null,
): string | null => {
  const capitalizeFirst = (text: string) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

  if (name && !isEmail(name)) {
    const { firstName } = getNameParts(name);
    return capitalizeFirst(firstName || name);
  }
  if (email) return capitalizeFirst(email.split("@")[0]);
  return name ? capitalizeFirst(name) : null;
};

export const getTaskAssigneeLabel = (task: NotepadTaskItem): string | null => {
  const owner = task.ownerProfile;
  if (owner?.__typename === "UserGroup") return `@${owner.handle}`;
  if (owner?.__typename === "Profile") {
    return getDisplayName(owner.name, owner.email);
  }
  if (task.ownerEmail) return getDisplayName(null, task.ownerEmail);
  // Only fall back to the AI-generated owner when the user hasn't explicitly
  // (re)assigned. After an unassign the server clears the owner but keeps
  // generatedOwnerName, so honoring it here would re-show the removed person.
  if (
    !task.hasChangedOwner &&
    task.generatedOwnerName &&
    task.generatedOwnerName !== "Unassigned"
  ) {
    return getDisplayName(task.generatedOwnerName);
  }
  return null;
};
