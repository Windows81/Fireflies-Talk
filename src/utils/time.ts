export const toHHMMSS = (secs: number, printFull?: boolean) => {
  const sec_num = Math.ceil(secs);
  const hours = Math.floor(sec_num / 3600) % 24;
  const minutes = Math.floor(sec_num / 60) % 60;
  const seconds = sec_num % 60;
  const timestamp = [hours, minutes || 0, seconds || 0]
    .map((v) => {
      return v < 10 ? `0${v}` : v;
    })
    .filter((v, i) => printFull || v !== "00" || i > 0)
    .join(":");
  return timestamp;
};

export const toHrMin = (secs: number) => {
  const sec_num = Math.ceil(secs);
  const hours = Math.floor(sec_num / 3600) % 24;
  const minutes = Math.ceil(sec_num / 60) % 60;
  let txt = "";
  if (hours > 0) txt += `${hours} hr${hours > 1 ? "s" : ""} `;
  if (minutes > 0) txt += `${minutes} min${minutes > 1 ? "s" : ""} `;
  return txt.trim() || "0 min";
};

export const toHourMinuteSecond = (secs: number) => {
  const sec_num = Math.ceil(secs);
  const hours = Math.floor(sec_num / 3600) % 24;
  const minutes = Math.floor(sec_num / 60) % 60;
  const seconds = sec_num % 60;
  let txt = "";
  if (hours > 0) txt += `${hours} hour${hours > 1 ? "s" : ""} `;
  if (minutes > 0) txt += `${minutes} minute${minutes > 1 ? "s" : ""} `;
  if (seconds > 0) txt += `${seconds} second${seconds > 1 ? "s" : ""} `;
  return txt.trim() || "0 second";
};

/** Compact duration like "2m 20s", "45s", or "1h 3m". */
export const toCompactDuration = (secs: number) => {
  const total = Math.round(secs);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
};

export const toSecFromHHMMSS = (time: string | number) => {
  if (typeof time === "number") return time;
  const [seconds, minutes, hours] = time
    .split(":")
    .reverse()
    .map((v) => (v ? parseInt(v) : 0));
  return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
};
