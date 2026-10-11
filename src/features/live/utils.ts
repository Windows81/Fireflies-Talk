export const getElapsedDuration = (startTime: Date | null | undefined) => {
  if (!startTime) return -1;
  const now = new Date();
  return Math.ceil((now.getTime() - startTime.getTime()) / 1000);
};
