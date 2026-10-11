import type { SharedMeetingTtlInput } from "@/graphql";

export const TTL_OPTIONS: {
  label: string;
  value: SharedMeetingTtlInput | null;
}[] = [
  {
    label: "Never",
    value: null,
  },
  {
    label: "1 hour",
    value: { duration: 1, unit: "hour" },
  },
  {
    label: "1 day",
    value: { duration: 1, unit: "day" },
  },
  {
    label: "7 days",
    value: { duration: 7, unit: "day" },
  },
  {
    label: "14 days",
    value: { duration: 14, unit: "day" },
  },
  {
    label: "30 days",
    value: { duration: 30, unit: "day" },
  },
];
