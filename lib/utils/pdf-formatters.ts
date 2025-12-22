/**
 * Utility functions for formatting data in PDF templates
 */

/**
 * Format currency with commas
 * @example formatCurrency("65000.00") => "65,000 AED"
 * @example formatCurrency(65000) => "65,000 AED"
 */
export function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value || "0") : value;
  return `${numValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} AED`;
}

/**
 * Format ISO date to readable format
 * @example formatDate("2025-11-18T10:59:00Z") => "Nov 18, 2025"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format ISO date with time
 * @example formatDateTime("2025-11-18T10:59:00Z") => "Nov 18, 2025, 10:59 AM"
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Get current date and time formatted for PDF generation
 * @example getCurrentDateTime() => "Dec 15, 2025, 05:51 PM"
 */
export function getCurrentDateTime(): string {
  const now = new Date();
  const datePart = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Format array of month numbers to readable range
 * @example formatMonthRange([6,7,8,9,10,11,12], 2025) => "Jun-Dec 2025"
 * @example formatMonthRange([1,2,3], 2025) => "Jan-Mar 2025"
 */
export function formatMonthRange(months: number[], year: number): string {
  if (!months || months.length === 0) return "";

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const sortedMonths = [...months].sort((a, b) => a - b);
  const firstMonth = monthNames[sortedMonths[0] - 1];
  const lastMonth = monthNames[sortedMonths[sortedMonths.length - 1] - 1];

  if (sortedMonths.length === 1) {
    return `${firstMonth} ${year}`;
  }

  return `${firstMonth}-${lastMonth} ${year}`;
}

/**
 * Capitalize first letter of tier
 * @example capitalizeTier("gold") => "Gold"
 */
export function capitalizeTier(tier: string): string {
  if (!tier) return "";
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/**
 * Get short ID (first 8 characters of UUID)
 * @example getShortId("d5e2c44d-ba51-444b-9446-ce3871bcb9af") => "d5e2c44d"
 */
export function getShortId(uuid: string): string {
  if (!uuid) return "";
  return uuid.substring(0, 8);
}

/**
 * Get full ID (returns the complete UUID)
 * @example getFullId("d5e2c44d-ba51-444b-9446-ce3871bcb9af") => "d5e2c44d-ba51-444b-9446-ce3871bcb9af"
 */
export function getFullId(uuid: string): string {
  return uuid || "";
}

/**
 * Get month name from number
 * @example getMonthName(1) => "JANUARY"
 */
export function getMonthName(month: number): string {
  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  return monthNames[month - 1] || "";
}
