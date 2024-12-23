import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with suffixes like 'K', 'M', 'B', or 'T'.
 * @param num - The number to format.
 * @param decimals - The number of decimal places to include (default: 1).
 * @returns A formatted string with the appropriate suffix.
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num === 0) return "0";

  const units = ["K", "M", "B", "T"]; // Thousand, Million, Billion, Trillion
  const divisor = 1000;

  // Determine the unit and scale
  let unitIndex = -1;
  let scaledNum = Math.abs(num);

  while (scaledNum >= divisor && unitIndex < units.length - 1) {
    scaledNum /= divisor;
    unitIndex++;
  }

  // Format the number with the appropriate decimal places
  const formatted = scaledNum.toFixed(decimals);

  // Add the sign and suffix (if applicable)
  const sign = num < 0 ? "-" : "";
  const suffix = unitIndex >= 0 ? units[unitIndex] : "";

  return `${sign}${formatted}${suffix}`;
}

export function formatNumberWithDots(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
