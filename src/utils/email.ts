import type { CalendarEvents } from "@/graphql";
import { matchesGenericDomain } from "@firefliesai/shared-libs.utils/dist/emails/emails";

const FIREFLIES_DOMAINS = ["fireflies.ai", "fireflies.dev"] as const;

const emailMatcher =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export function isEmail(string: string) {
  return emailMatcher.test(string);
}

export function isGenericDomain(domain: string) {
  return matchesGenericDomain(domain);
}

export const isFirefliesEmail = (userEmail?: string): boolean => {
  if (!userEmail) return false;
  const domain = userEmail.split("@").pop()?.trim().toLowerCase() ?? "";
  return FIREFLIES_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`),
  );
};

export const getExternalDomains = (
  event: CalendarEvents,
  userEmail: string,
) => {
  if (!isFirefliesEmail(userEmail)) {
    return [];
  }
  const extractDomains = (emails: string[] = []) =>
    Array.from(
      new Set(
        emails
          .map((email) => email?.split("@")?.pop()?.trim())
          .filter((domain) => !isGenericDomain(domain || "")),
      ),
    );

  const currentDomain = userEmail.split("@")?.pop()?.trim();

  const emails = event?.lastMeeting
    ? event.lastMeeting.participantsProfiles?.map((p) => p?.email)
    : event?.attendees?.map((a) => a?.email);

  return extractDomains(emails as string[]).filter(
    (domain) => domain !== currentDomain,
  );
};
