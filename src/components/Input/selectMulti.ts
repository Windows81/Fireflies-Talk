export function nextMultiSelectValues<TValue>(
  selected: TValue[],
  nextValue: TValue,
  maxSelections?: number,
): TValue[] | undefined {
  const isSelected = selected.includes(nextValue);
  if (
    !isSelected &&
    maxSelections != null &&
    selected.length >= maxSelections
  ) {
    return undefined;
  }
  return isSelected
    ? selected.filter((item) => item !== nextValue)
    : [...selected, nextValue];
}
