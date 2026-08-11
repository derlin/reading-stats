// The global date range: the one control every chart and the table filter on.
//
// Two things the pre-rewrite site did not do (D8):
//
//  - the range lives in the URL (`?from=…&to=…`), so it survives a reload and
//    a view can be linked. History is replaced rather than pushed, so dragging
//    a date input doesn't bury the previous page under a stack of entries.
//  - the boundaries and presets are derived from the payload rather than from
//    a module-level singleton, so nothing needs a rebuild when the data moves.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Payload } from '../types/payload';
import { formatDateOnly, parseDateOnly, type DateRange } from './useFilteredData';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const PARAM_FROM = 'from';
export const PARAM_TO = 'to';

/** The preset selected when the URL carries no range — the old site's default. */
export const DEFAULT_PRESET = 'This Year';

export interface Boundaries {
  minDate: Date;
  maxDate: Date;
  /** Every calendar year the data touches, ascending. */
  years: number[];
}

export interface Preset {
  label: string;
  range: DateRange;
}

function addMonthsUTC(date: Date, months: number): Date {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()),
  );
  // Date.UTC rolls overflow forward (Aug 31 − 6 months would land on Mar 2/3),
  // which would silently widen the range. Clamp back to the month's last day.
  if (target.getUTCDate() !== date.getUTCDate()) {
    target.setUTCDate(0);
  }
  return target;
}

function clamp(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export function computeBoundaries(payload: Payload): Boundaries {
  const epoch = parseDateOnly(payload.epoch);
  const offsets = payload.sessions.date;
  const minDate = new Date(epoch.getTime() + Math.min(...offsets) * MS_PER_DAY);
  const maxDate = new Date(epoch.getTime() + Math.max(...offsets) * MS_PER_DAY);

  const years: number[] = [];
  for (let year = minDate.getUTCFullYear(); year <= maxDate.getUTCFullYear(); year++) {
    years.push(year);
  }
  return { minDate, maxDate, years };
}

/** A calendar year's range, clamped to the data's bounds. Shared by the year presets and the per-year overview's click-to-select. */
export function yearRange(year: number, { minDate, maxDate }: Boundaries): DateRange {
  return {
    start: clamp(new Date(Date.UTC(year, 0, 1)), minDate, maxDate),
    end: clamp(new Date(Date.UTC(year, 11, 31)), minDate, maxDate),
  };
}

export function computePresets(boundaries: Boundaries): Preset[] {
  const { minDate, maxDate, years } = boundaries;
  const lastYear = maxDate.getUTCFullYear();
  return [
    { label: 'All', range: { start: minDate, end: maxDate } },
    {
      label: 'Last 6 Months',
      // +1 day because both bounds are inclusive: the range covers the whole
      // first and last day, so six months back lands on the day after.
      range: {
        start: clamp(new Date(addMonthsUTC(maxDate, -6).getTime() + MS_PER_DAY), minDate, maxDate),
        end: maxDate,
      },
    },
    {
      label: DEFAULT_PRESET,
      range: {
        start: clamp(new Date(Date.UTC(lastYear, 0, 1)), minDate, maxDate),
        end: maxDate,
      },
    },
    // The most recent year is dropped — "This Year" already covers it.
    ...years
      .filter(year => year !== lastYear)
      .reverse()
      .map(year => ({ label: String(year), range: yearRange(year, boundaries) })),
  ];
}

function parseParam(value: string | null, boundaries: Boundaries): Date | null {
  if (!value || !DATE_ONLY.test(value)) return null;
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return null;
  return clamp(date, boundaries.minDate, boundaries.maxDate);
}

/**
 * Reads the range out of a query string, falling back to the default preset.
 * A malformed, out-of-bounds or inverted range degrades to the default rather
 * than throwing — the URL is user-editable and shared, so it is untrusted input.
 */
export function rangeFromSearch(search: string, boundaries: Boundaries): DateRange {
  const params = new URLSearchParams(search);
  const start = parseParam(params.get(PARAM_FROM), boundaries);
  const end = parseParam(params.get(PARAM_TO), boundaries);
  // biome-ignore lint/style/noNonNullAssertion: DEFAULT_PRESET is always present in computePresets' output.
  const fallback = computePresets(boundaries).find(p => p.label === DEFAULT_PRESET)!.range;

  if (!start && !end) return fallback;
  const resolved = { start: start ?? boundaries.minDate, end: end ?? boundaries.maxDate };
  return resolved.start > resolved.end ? fallback : resolved;
}

function searchFromRange(range: DateRange): string {
  const params = new URLSearchParams(window.location.search);
  params.set(PARAM_FROM, formatDateOnly(range.start));
  params.set(PARAM_TO, formatDateOnly(range.end));
  return `?${params.toString()}`;
}

export interface UseDateRange {
  range: DateRange;
  boundaries: Boundaries;
  presets: Preset[];
  /** Label of the preset exactly matching the current range, if any. */
  selectedPreset: string | undefined;
  setRange: (range: DateRange) => void;
}

export function useDateRange(payload: Payload): UseDateRange {
  const boundaries = useMemo(() => computeBoundaries(payload), [payload]);
  const presets = useMemo(() => computePresets(boundaries), [boundaries]);

  const [range, setRangeState] = useState<DateRange>(() =>
    rangeFromSearch(window.location.search, boundaries),
  );

  const setRange = useCallback((next: DateRange) => {
    setRangeState(next);
    window.history.replaceState(null, '', searchFromRange(next));
  }, []);

  // Someone navigating with the back button, or editing the URL by hand,
  // still moves the range — the URL is the source of truth, not a mirror.
  useEffect(() => {
    const onPopState = () => setRangeState(rangeFromSearch(window.location.search, boundaries));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [boundaries]);

  const selectedPreset = useMemo(
    () =>
      presets.find(
        p =>
          p.range.start.getTime() === range.start.getTime() &&
          p.range.end.getTime() === range.end.getTime(),
      )?.label,
    [presets, range.start, range.end],
  );

  return { range, boundaries, presets, selectedPreset, setRange };
}
