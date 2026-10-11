import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import {
  EnrichDomainsByMeetingIdDocument as ENRICH_DOMAINS_QUERY_BY_MEETING_ID,
  EnrichDomainsByICalUidDocument as ENRICH_DOMAINS_QUERY_BY_ICALUID,
} from "@/graphql";

export interface RecentHeadline {
  emoji: string;
  title: string;
  content: string;
  occurredAt: string;
}

export interface EnrichedOrganization {
  _id: string;
  domain: string;
  description: string;
  name: string;
  recentHeadlines?: RecentHeadline[];
}

interface UseEnrichDomainOptions {
  meetingId?: string;
  iCalUID?: string;
  skip?: boolean;
  fetchPolicy?:
    | "cache-first"
    | "cache-and-network"
    | "network-only"
    | "cache-only"
    | "no-cache";
  errorPolicy?: "none" | "ignore" | "all";
}

interface UseEnrichDomainResult {
  data: EnrichedOrganization[] | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Hook to fetch enriched domain data for a meeting
 * Uses meetingId if available, otherwise falls back to iCalUID
 *
 * @param options - Configuration options for the hook
 * @returns Enriched domain data, loading state, and error information
 */
export const useEnrichDomain = (
  options: UseEnrichDomainOptions = {},
): UseEnrichDomainResult => {
  const {
    meetingId,
    iCalUID,
    skip = false,
    fetchPolicy = "cache-and-network",
    errorPolicy = "none",
  } = options;

  // Determine which query to use and skip conditions
  const shouldUseMeetingId = useMemo(() => {
    return !skip && !!meetingId;
  }, [skip, meetingId]);

  const shouldUseICalUID = useMemo(() => {
    return !skip && !meetingId && !!iCalUID;
  }, [skip, meetingId, iCalUID]);

  const {
    data: meetingIdData,
    loading: meetingIdLoading,
    error: meetingIdError,
  } = useQuery(ENRICH_DOMAINS_QUERY_BY_MEETING_ID, {
    variables: { meetingId: meetingId || "" },
    skip: !shouldUseMeetingId,
    fetchPolicy,
    errorPolicy,
  });

  const {
    data: iCalUIDData,
    loading: iCalUIDLoading,
    error: iCalUIDError,
  } = useQuery(ENRICH_DOMAINS_QUERY_BY_ICALUID, {
    variables: { iCalUID: iCalUID || "" },
    skip: !shouldUseICalUID,
    fetchPolicy,
    errorPolicy,
  });

  const result = useMemo(() => {
    if (shouldUseMeetingId) {
      return {
        data: meetingIdData?.enrichDomains,
        loading: meetingIdLoading,
        error: meetingIdError as Error | undefined,
      };
    }

    if (shouldUseICalUID) {
      return {
        data: iCalUIDData?.enrichDomains,
        loading: iCalUIDLoading,
        error: iCalUIDError as Error | undefined,
      };
    }

    return {
      data: undefined,
      loading: false,
      error: undefined,
    };
  }, [
    shouldUseMeetingId,
    shouldUseICalUID,
    meetingIdData?.enrichDomains,
    meetingIdLoading,
    meetingIdError,
    iCalUIDData?.enrichDomains,
    iCalUIDLoading,
    iCalUIDError,
  ]);

  return result;
};
