import { Config } from "@/constants";
import type { Meeting } from "@/graphql";
import { toSecFromHHMMSS } from "@/utils/time";

/**
 * Find all protected ranges (markdown links and code spans) in the content
 * where timestamps should not be transformed
 */
const findProtectedRanges = (content: string): Array<[number, number]> => {
  const ranges: Array<[number, number]> = [];

  // Find markdown links: [text](url)
  const linkRegex = /\[([^\]]*)\]\([^)]+\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  // Find inline code spans: `code`
  const codeRegex = /`[^`]+`/g;
  while ((match = codeRegex.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  // Find code blocks: ```code```
  const codeBlockRegex = /```[\s\S]*?```/g;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  return ranges;
};

/**
 * Check if a position is inside any protected range
 */
const isInProtectedRange = (
  position: number,
  ranges: Array<[number, number]>,
): boolean => {
  return ranges.some(([start, end]) => position >= start && position < end);
};

/**
 * Transform "00:00" into "[00:00](fireflies://view/${meeting.id}?t=0)"
 * Skips timestamps that are already inside markdown links or code spans
 */
const transformContentTimestamp = (
  meeting: Pick<Meeting, "id">,
  content: string,
) => {
  const timestampRegex = /(\d{1,2}:\d{1,2}(?::\d{1,2})?)/g;
  const protectedRanges = findProtectedRanges(content);

  const matches: Array<{ index: number; match: string }> = [];
  let match;

  // Collect all timestamp matches that are not in protected ranges
  while ((match = timestampRegex.exec(content)) !== null) {
    if (!isInProtectedRange(match.index, protectedRanges)) {
      matches.push({ index: match.index, match: match[0] });
    }
  }

  // Replace timestamps from end to start to preserve indices
  let result = content;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { index, match: timestamp } = matches[i];
    const replacement = `[${timestamp}](fireflies://view/${meeting.id}?t=${toSecFromHHMMSS(timestamp)})`;
    result =
      result.slice(0, index) +
      replacement +
      result.slice(index + timestamp.length);
  }

  return result;
};

/**
 * Replace dashboard URLs with internal deep links
 * Transforms dashboard URLs to fireflies://*
 */
const transformDashboardUrls = (content: string) => {
  const dashboardUrl = Config.DASHBOARD_URL.replace(/\/$/, "");
  // Replace only when followed by a path
  const needle = `${dashboardUrl}/`;
  if (!needle || !content.includes(needle)) return content;
  return content.split(needle).join("fireflies://");
};

/**
 * Transform and enrich the content to make certain elements interactive
 */
export const transformContent = (
  meeting: Pick<Meeting, "id">,
  content: string,
) => {
  // First replace dashboard URLs with deep links
  content = transformDashboardUrls(content);
  // Then transform timestamps
  content = transformContentTimestamp(meeting, content);
  return content;
};
