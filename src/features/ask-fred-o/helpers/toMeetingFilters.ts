import type { MeetingFilters } from "@firefliesai/fred-client";
import { subDays } from "date-fns";

export const ANY_TIME = "any";
export const ALL_CHANNELS = "all";

export type AskFredORange = typeof ANY_TIME | "7d" | "30d" | "90d";

export interface AskFredOScope {
  range: AskFredORange;
  channelId: string;
}

const RANGE_DAYS: Record<Exclude<AskFredORange, typeof ANY_TIME>, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const toMeetingFilters = (
  scope: AskFredOScope,
  now: Date,
): MeetingFilters => {
  const filters: MeetingFilters = {};

  if (scope.range !== ANY_TIME) {
    filters.startTime = subDays(now, RANGE_DAYS[scope.range]).toISOString();
  }

  if (scope.channelId !== ALL_CHANNELS) {
    filters.channelIds = [scope.channelId];
  }

  return filters;
};
