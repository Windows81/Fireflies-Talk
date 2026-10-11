import { pluralize } from "@/utils/pluralize";
import { parseTimestamp } from "@/utils/date";
import type { LiveMeetingActivity } from "@/features/live";

const getCreatedAt = (activity: LiveMeetingActivity) =>
  parseTimestamp(activity.createdAt);

export const getLiveActivityTimestamp = (activity: LiveMeetingActivity) => {
  const time = Number(
    ("timestamp" in activity && activity.timestamp) ||
      ("time" in activity && activity.time),
  );
  return time;
};

/**
 * Group activity by every 10min
 */
export const groupByTimeRange = (activities: LiveMeetingActivity[]) => {
  const groups: {
    time: number;
    endTime: number;
    activities: LiveMeetingActivity[];
  }[] = [];
  for (const activity of activities) {
    const time = getLiveActivityTimestamp(activity);
    const timeMin = Math.floor(time / 60);
    const startTime = Math.floor(timeMin / 10) * 10 * 60;
    const endTime = startTime + 60 * 10;
    const group = groups.find((g) => g.time === startTime);

    if (group) {
      group.activities.push(activity);
    } else {
      groups.push({ time: startTime, endTime, activities: [activity] });
    }
  }
  return groups;
};

export const getTimeString = (activity: LiveMeetingActivity) => {
  const createdAt = getCreatedAt(activity);
  if (!createdAt) {
    return "";
  }
  const now = new Date();
  const minDiff = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
  if (minDiff < 1) {
    return "Just now";
  }
  return `${minDiff} ${pluralize("min", minDiff)}`;
};
