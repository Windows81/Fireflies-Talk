import uniqolor from "uniqolor";

// this uniqolor lib generates same color if the change is only in numbers
// so defined static colors for limited speakers
const SPEAKER_COLORS: Record<string, string> = {
  "Speaker 1": "#E06C75",
  "Speaker 2": "#61AFEF",
  "Speaker 3": "#98C379",
  "Speaker 4": "#D19A66",
  "Speaker 5": "#C678DD",
  "Speaker 6": "#56B6C2",
  "Speaker 7": "#E5C07B",
  "Speaker 8": "#AE5096",
  "Speaker 9": "#7EC8A3",
  "Speaker 10": "#C3E88D",
};

const UNIQUE_COLOR_CACHE: Record<string, string> = { ...SPEAKER_COLORS };

export const getUniqueColor = (str: string): string => {
  if (!UNIQUE_COLOR_CACHE[str]) {
    UNIQUE_COLOR_CACHE[str] = uniqolor(str || "?").color;
  }
  return UNIQUE_COLOR_CACHE[str];
};

/**
 * Pick a foreground color that stays legible on top of `hex`, using the
 * perceived-luminance (WCAG) threshold. Keeps avatar initials readable when the
 * generated background lands on a light hue instead of forcing white.
 */
export const getReadableTextColor = (hex: string): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length < 6) return "#FFFFFF";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#101828" : "#FFFFFF";
};

/**
 * Build the deep-tinted background + translucent foreground used by the Notepad
 * task assignee pill. The background is the owner's unique hue mixed heavily
 * toward black so the colored chip reads against the dark notepad surface.
 */
export const getAssigneePillColors = (
  name: string,
): { background: string; text: string } => {
  const normalized = getUniqueColor(name).replace("#", "");
  const channel = (start: number) =>
    Math.round(parseInt(normalized.slice(start, start + 2), 16) * 0.16)
      .toString(16)
      .padStart(2, "0");
  return {
    background: `#${channel(0)}${channel(2)}${channel(4)}`,
    text: "rgba(255, 255, 255, 0.4)",
  };
};
