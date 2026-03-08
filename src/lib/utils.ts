import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely convert a value (possibly text from DB) to a number.
 * Returns 0 for null, undefined, NaN, or non-numeric strings.
 */
export function toNum(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

/**
 * Format a numeric value as Indian Rupee currency string (₹1,23,456.00).
 * Handles text-based DB fields by converting to Number first.
 * @param value - number or string to format
 * @param decimals - minimum fraction digits (default 0)
 * @param prefix - currency prefix (default "₹")
 */
export function formatINR(value: any, decimals: number = 0, prefix: string = "₹"): string {
  const num = toNum(value);
  return `${prefix}${num.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: 2 })}`;
}
