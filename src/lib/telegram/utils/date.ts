import { parse, isValid } from "date-fns";

/**
 * Parse a date string in common formats:
 * - DD/MM/YYYY (Italian default)
 * - DD-MM-YYYY
 * - YYYY-MM-DD (ISO)
 */
export function parseDate(input: string): Date | null {
  if (!input || input.toLowerCase() === "n/a" || input === "—") return null;

  const formats = [
    "dd/MM/yyyy",
    "d/M/yyyy",
    "dd-MM-yyyy",
    "yyyy-MM-dd",
    "dd/MM/yy",
  ];

  for (const fmt of formats) {
    const parsed = parse(input.trim(), fmt, new Date());
    if (isValid(parsed) && parsed.getFullYear() > 1900) {
      return parsed;
    }
  }

  return null;
}

export function formatDateIt(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
