export const partialUpsertDataArray = <T>(
  data: T[],
  newData: T,
  field: keyof T,
): T[] => {
  const index = data.findIndex((d) => d[field] === newData[field]);
  if (index === -1) {
    return [...data, newData];
  }
  return data.map((d, i) =>
    i === index
      ? {
          ...d,
          ...newData,
        }
      : d,
  );
};

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
