import { Config } from "@/constants";
import type { Meeting } from "@/graphql";
import { toSecFromHHMMSS } from "@/utils/time";

/**
 * Transform "00:00" into "[00:00](/view/${meeting.id}?t=0)"
 */
const transformContentTimestamp = (meeting: Meeting, content: string) => {
  const timestampRegex = /(\d{1,2}:\d{1,2}(?::\d{1,2})?)/gim;
  return content.replace(
    timestampRegex,
    (match) =>
      `[${match}](${Config.DASHBOARD_URL}/view/${meeting.id}?t=${toSecFromHHMMSS(match)})`,
  );
};

/**
 * Transform and enrich the content to make certain elements interactive
 */
export const transformContent = (meeting: Meeting, content: string) => {
  return transformContentTimestamp(meeting, content);
};
