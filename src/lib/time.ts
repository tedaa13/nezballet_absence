// All schedule logic runs in the studio's timezone, not the server's (Vercel runs in UTC).
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ZonedParts = {
  year: number;
  month: number; // 1..12
  day: number;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  minutesOfDay: number;
};

export function zonedParts(date: Date): ZonedParts {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    dayOfWeek: WEEKDAYS.indexOf(parts.weekday),
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** The studio-local calendar date of `date`, as midnight UTC (how date-only columns are stored). */
export function localDate(date: Date): Date {
  const { year, month, day } = zonedParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Strip a date-only value (stored as midnight UTC) down to its UTC calendar date. */
export function utcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", { timeZone: APP_TIMEZONE });
}

/** Format a date-only value (stored as midnight UTC). */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", { timeZone: "UTC" });
}
