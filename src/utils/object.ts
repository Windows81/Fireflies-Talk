export function isDefined<T>(x: T | null | undefined): x is T {
  return x !== undefined && x !== null;
}

export function isTruthy<T>(x: T | null | undefined | false): x is T {
  return !!x;
}

export function mapByKey<O extends Record<string, any>, K extends keyof O>(
  array: O[],
  key: K,
): Record<string, O> {
  return array.reduce(
    (acc, item) => {
      acc[item[key]] = item;
      return acc;
    },
    {} as Record<string, O>,
  );
}
