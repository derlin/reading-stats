// Formatting helpers for the prose overview, the book table and the charts.
//
// The pre-rewrite site got these from date-fns (`format`, `formatDuration`,
// `intervalToDuration`). date-fns was dropped in B1 and is not worth
// re-adding for four functions, so they are hand-rolled here. Everything
// operates on UTC calendar components, matching parseDateOnly/formatDateOnly
// in useFilteredData — the payload's dates are calendar days, not instants,
// and reading them in local time shifts them by a day west of UTC.

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** 12'345 — thousands separated by an apostrophe, as the old site did. */
export function formatCount(value: number): string {
  return value.toLocaleString('en').replaceAll(',', "'");
}

const longDateFormatter = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Saturday, August 9, 2026 */
export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

const mediumDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** 25 June, 2023 — for prose that names a specific day without the weekday. */
export function formatMediumDate(date: Date): string {
  return `${mediumDateFormatter.format(date)}, ${date.getUTCFullYear()}`;
}

function pluralise(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

function joinUnits(parts: string[]): string {
  return parts.length > 0 ? parts.join(' ') : '0 minutes';
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Calendar distance between two dates as years/months/days, borrowing from
 * the larger unit when a component goes negative. `end` is exclusive, so
 * callers pass the day *after* the range's last day to describe an inclusive
 * range. Non-zero components only: "6 years 2 months 21 days", "3 days".
 */
export function formatCalendarSpan(start: Date, end: Date): string {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months--;
    // Borrow from the month preceding `end`, which is the month the
    // remaining days actually fall in.
    days += daysInMonth(end.getUTCFullYear(), end.getUTCMonth() - 1);
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(pluralise(years, 'year'));
  if (months > 0) parts.push(pluralise(months, 'month'));
  if (days > 0) parts.push(pluralise(days, 'day'));
  return joinUnits(parts);
}

/**
 * A minute total as elapsed non-stop time: "23 days 4 hours 11 minutes".
 * Days here are flat 24-hour blocks, not calendar days — this describes a
 * duration, not a span between two dates.
 */
export function formatElapsedMinutes(total: number): string {
  const days = Math.floor(total / (MINUTES_PER_HOUR * HOURS_PER_DAY));
  const hours = Math.floor((total % (MINUTES_PER_HOUR * HOURS_PER_DAY)) / MINUTES_PER_HOUR);
  const minutes = total % MINUTES_PER_HOUR;

  const parts: string[] = [];
  if (days > 0) parts.push(pluralise(days, 'day'));
  if (hours > 0) parts.push(pluralise(hours, 'hour'));
  if (minutes > 0) parts.push(pluralise(minutes, 'minute'));
  return joinUnits(parts);
}

/**
 * A minute total in the charts' compact notation: "45m", "59h 12m", "0m".
 *
 * Every chart hover, label and detail line goes through this one function, so
 * the notation is a single edit away if Lucy changes her mind about it. It is
 * deliberately *not* `formatHoursMinutes` ("2:07"): a bare clock value only
 * reads unambiguously in the table's right-aligned monospace column, whereas
 * these appear mid-sentence and inside hover boxes.
 */
export function formatDuration(minutes: number): string {
  // Callers include fractional minutes (the time-of-day heatmap splits a
  // session across the hours it spans), so round before splitting the units —
  // otherwise the remainder carries a decimal into the string.
  const total = Math.round(minutes);
  const hours = Math.floor(total / MINUTES_PER_HOUR);
  const rest = total % MINUTES_PER_HOUR;
  return hours > 0 ? `${hours}h${String(rest).padStart(2, '0')}` : `${rest}m`;
}

/** 127 -> "2:07". Used for the table's right-aligned monospace Hours column. */
export function formatHoursMinutes(total: number): string {
  const hours = Math.floor(total / MINUTES_PER_HOUR);
  const minutes = total % MINUTES_PER_HOUR;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}
