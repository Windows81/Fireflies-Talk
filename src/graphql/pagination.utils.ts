import type { FieldFunctionOptions } from "@apollo/client";

const removeDuplicateObjects = <T>(arr: T[], options: FieldFunctionOptions) => {
  const existingIds = new Set<string>();
  const result: T[] = [];
  for (const item of arr) {
    if (!item) {
      continue;
    }
    const id = options.toReference(item)?.__ref;
    if (!id) {
      result.push(item);
    } else if (!existingIds.has(id)) {
      existingIds.add(id);
      result.push(item);
    } else {
      // duplicate, ignore
    }
  }
  return result;
};

/**
 * Merging for cursor paginated queries returning { meetings: [any], next, hasNext }.
 * A fetch carrying a cursor appends the page; a fetch without one (initial load,
 * poll, refetch) replaces the head of the list while keeping the pages already
 * loaded past it, along with the cursor those pages reached.
 */
export const mergeCursorMeetingResults =
  (cursorArg = "next", sortField = "startTime") =>
  (existing: any, incoming: any, options: FieldFunctionOptions) => {
    const existingMeetings = existing?.meetings || [];
    // `meetings` is nullable in the schema; a null would throw below and leave the cache
    // unwritten
    const incomingMeetings = incoming?.meetings || [];

    if (options.args?.[cursorArg]) {
      return {
        ...incoming,
        meetings: removeDuplicateObjects(
          [...existingMeetings, ...incomingMeetings],
          options,
        ),
      };
    }

    // nothing left in the queried range, so the cached list is stale in its entirety
    if (!incomingMeetings.length) {
      return { ...incoming, meetings: [] };
    }

    const incomingIds = new Set(
      incomingMeetings.map(
        (meeting: unknown) => options.toReference(meeting as never)?.__ref,
      ),
    );
    // a refreshed page sharing no meeting with the cache is disjoint from it — more than
    // a page of meetings appeared — so it becomes the whole list and its cursor applies
    const overlapsCache = existingMeetings.some((meeting: unknown) =>
      incomingIds.has(options.toReference(meeting as never)?.__ref),
    );
    if (!overlapsCache) {
      return { ...incoming, meetings: incomingMeetings };
    }

    // Results are sorted by `sortField` descending, so the refreshed page is
    // authoritative down to its oldest entry: cached meetings inside that window are
    // dropped (they were deleted server side) while later pages are kept in place.
    // Entries tied with the boundary are kept — the server breaks ties on `_id`, which
    // the client cannot replicate, so a deleted one lingers until it leaves the window.
    const oldestIncoming = options.readField<number>(
      sortField,
      incomingMeetings[incomingMeetings.length - 1],
    );
    const olderPages = existingMeetings.filter((meeting: unknown) => {
      if (oldestIncoming == null) return true;
      const sortValue = options.readField<number>(sortField, meeting as never);
      return sortValue == null || sortValue <= oldestIncoming;
    });
    const meetings = removeDuplicateObjects(
      [...incomingMeetings, ...olderPages],
      options,
    );

    // the cached cursor only stays valid while entries past the refreshed window survive;
    // otherwise the refreshed page is the whole list and its cursor is the current one
    const keptLaterPages = olderPages.some(
      (meeting: unknown) =>
        !incomingIds.has(options.toReference(meeting as never)?.__ref),
    );

    return keptLaterPages
      ? {
          ...incoming,
          next: existing.next,
          hasNext: existing.hasNext,
          meetings,
        }
      : { ...incoming, meetings };
  };

/**
 * Merging that works with queries that return in the format of { meetings: [any], ...any }
 */
export const mergeDashboardMeetingResults =
  (offsetArg: string | ((options: FieldFunctionOptions) => number) = "from") =>
  (existing: any, incoming: any, options: FieldFunctionOptions) => {
    const merged = {
      ...(existing || {}),
      // to get fields like 'total', 'totalCount', etc.
      ...incoming,
      meetings: existing?.meetings?.slice(0) || [],
    };

    const offset =
      (typeof offsetArg === "function"
        ? offsetArg(options)
        : options.args?.[offsetArg]) || 0;

    for (let i = 0; i < incoming.meetings.length; ++i) {
      merged.meetings[offset + i] = incoming.meetings[i];
    }
    merged.meetings = removeDuplicateObjects(merged.meetings, options);

    return merged;
  };
