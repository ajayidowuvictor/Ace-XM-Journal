const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Local calendar date as `YYYY-MM-DD` (uses the device's time zone, not UTC). */
export function toLocalDateString(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True only for real calendar dates written as `YYYY-MM-DD`. */
export function isValidDateString(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** The local date `days` days after the given date, as `YYYY-MM-DD`. */
export function addDays(date: Date, days: number): string {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return toLocalDateString(next);
}

/** Short label such as "14 Oct" for a `YYYY-MM-DD` date, in the device's language. */
export function formatShortDate(value: string, locale?: string): string {
  if (!isValidDateString(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

/** The local Date for a `YYYY-MM-DD` string (midnight, device time zone). Null if invalid. */
export function parseLocalDate(value: string): Date | null {
  if (!isValidDateString(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The local date `days` days after a `YYYY-MM-DD` date, as `YYYY-MM-DD`. Null if invalid. */
export function shiftDateString(value: string, days: number): string | null {
  const date = parseLocalDate(value);
  return date ? addDays(date, days) : null;
}

/** A stored date in full, such as "Friday 6 November 2026". Returns the text itself if it is not a date. */
export function formatFullDate(value: string, locale?: string): string {
  const date = parseLocalDate(value);
  return date
    ? date.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : value;
}
