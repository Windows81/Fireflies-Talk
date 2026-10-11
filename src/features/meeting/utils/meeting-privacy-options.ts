import { getMeetingPrivacyOption } from "@/constants";
import { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";

export const DEFAULT_MEETING_PRIVACY_LEVEL_ORDER = [
  MeetingNotesPrivacy.Link,
  MeetingNotesPrivacy.Teammatesandparticipants,
  MeetingNotesPrivacy.Participatingteammates,
  MeetingNotesPrivacy.Participants,
  MeetingNotesPrivacy.Teammates,
  MeetingNotesPrivacy.Owner,
] as const;

const MEETING_PRIVACY_VALUES = new Set<string>(
  Object.values(MeetingNotesPrivacy),
);

export interface MeetingPrivacyOptionsConfig {
  customPrivacyPrivilegesEnabled: boolean;
  teamPrivacy: string | null | undefined;
  customPrivacyPrecedence: unknown;
  restrictedPrivacies: unknown;
  participatingTeammatesEnabled: boolean;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMeetingPrivacy(value: unknown): MeetingNotesPrivacy | undefined {
  if (typeof value === "string" && MEETING_PRIVACY_VALUES.has(value)) {
    return value as MeetingNotesPrivacy;
  }
  return undefined;
}

// Custom precedence wins only when every key is a known privacy value;
// anything else falls back to the default order (dashboard-ff semantics).
function parsePrivacyLevelOrder(
  customPrivacyPrecedence: unknown,
): readonly MeetingNotesPrivacy[] {
  if (!isObjectRecord(customPrivacyPrecedence)) {
    return DEFAULT_MEETING_PRIVACY_LEVEL_ORDER;
  }

  const privacyValues: MeetingNotesPrivacy[] = [];
  for (const key of Object.keys(customPrivacyPrecedence)) {
    const privacy = parseMeetingPrivacy(key);
    if (!privacy) {
      return DEFAULT_MEETING_PRIVACY_LEVEL_ORDER;
    }
    privacyValues.push(privacy);
  }

  return privacyValues.length > 0
    ? privacyValues
    : DEFAULT_MEETING_PRIVACY_LEVEL_ORDER;
}

function parseRestrictedPrivacies(
  restrictedPrivacies: unknown,
): ReadonlySet<MeetingNotesPrivacy> {
  const restricted = new Set<MeetingNotesPrivacy>();
  if (!isObjectRecord(restrictedPrivacies)) return restricted;

  for (const key of Object.keys(restrictedPrivacies)) {
    const privacy = parseMeetingPrivacy(key);
    if (privacy) restricted.add(privacy);
  }
  return restricted;
}

// Mirrors desktop-ff getMeetingPrivacyOptions / dashboard-ff
// getFilteredPrivacyLevels + filterPrivacyOptions.
export function getMeetingPrivacyOptions({
  customPrivacyPrivilegesEnabled,
  teamPrivacy,
  customPrivacyPrecedence,
  restrictedPrivacies,
  participatingTeammatesEnabled,
}: MeetingPrivacyOptionsConfig) {
  let privacyValues = parsePrivacyLevelOrder(customPrivacyPrecedence);

  if (!participatingTeammatesEnabled) {
    privacyValues = privacyValues.filter(
      (value) => value !== MeetingNotesPrivacy.Participatingteammates,
    );
  }

  const restricted = parseRestrictedPrivacies(restrictedPrivacies);
  if (restricted.size > 0) {
    privacyValues = privacyValues.filter((value) => !restricted.has(value));
  }

  const parsedTeamPrivacy = parseMeetingPrivacy(teamPrivacy);
  if (customPrivacyPrivilegesEnabled && parsedTeamPrivacy) {
    const teamPrivacyIndex = privacyValues.indexOf(parsedTeamPrivacy);
    // Dashboard falls back to the full filtered list when the team privacy is
    // not part of the (filtered) precedence.
    if (teamPrivacyIndex !== -1) {
      privacyValues = privacyValues.slice(teamPrivacyIndex);
    }
  }

  return privacyValues.map(getMeetingPrivacyOption);
}

// Forms keep their own selected privacy; when the team lock filters that
// value out, fall back to the least restrictive allowed option.
export function resolveAllowedMeetingPrivacy(
  privacy: MeetingNotesPrivacy | null | undefined,
  options: ReadonlyArray<{ value: MeetingNotesPrivacy }>,
): MeetingNotesPrivacy | undefined {
  if (privacy && options.some((option) => option.value === privacy)) {
    return privacy;
  }
  return options[0]?.value;
}
