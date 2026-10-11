/**
 * Format a USD amount for display. Whole-dollar amounts drop the trailing
 * `.00` (e.g. `19` -> `"$19"`), fractional amounts keep two decimals
 * (e.g. `19.5` -> `"$19.50"`).
 */
export const formatUsd = (amount: number): string =>
  Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
