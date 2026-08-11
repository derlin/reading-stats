import { useMemo } from 'react';
import type { Book, Payload } from '../types/payload';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EnrichedSession {
  /** Index into payload.sessions' columns. */
  index: number;
  dayOffset: number;
  date: Date;
  bookIndex: number;
  book: Book;
  minutes: number;
  /** Seconds since local midnight; null when Boosted recorded no clock time (see Sessions.start). */
  start: number | null;
  end: number | null;
}

export interface DayAggregate {
  dayOffset: number;
  date: Date;
  minutes: number;
  sessions: EnrichedSession[];
}

export interface Stats {
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
}

export interface MonthAggregate {
  /** YYYY-MM */
  month: string;
  minutes: number;
  stats: Stats;
}

export interface HourWeekday {
  /** `minutes[weekday][hour]`, weekday 0 = Monday, hour 0–23. Fractional: a session's minutes are split across the hours it spans. */
  minutes: number[][];
  /** Sessions left out because Boosted recorded no clock time for them. 3 in the current data. */
  skipped: number;
}

export interface BookAggregate {
  bookIndex: number;
  book: Book;
  /** Total minutes across the book's whole reading history, not clipped to the selected range. */
  minutes: number;
  dayStart: number;
  dayEnd: number;
  /** Inclusive day span, dayEnd - dayStart + 1. Meaningless when `hasSessions` is false. */
  days: number;
  /** True when the book's full reading span extends outside the selected range. */
  partial: boolean;
  /**
   * False for a book with no tracked sessions — an untimed audiobook, placed
   * by `date_read` alone. Such a book has no real span, so `days` is a
   * placeholder and it must be kept out of anything time-based.
   */
  hasSessions: boolean;
}

export interface Summary {
  totalMinutes: number;
  /** Books whose reading overlaps the selected range at all (matches the old site's semantics: a book started before, or still being read past, the range edge still counts). */
  totalBooksFinished: number;
  totalPages: number;
  daysMissed: number;
  daysUnderTen: number;
  audiobookCount: number;
  audiobookMinutes: number;
  /** Finished books in range counted by format, for the overview's format-mix sentence (D10). `unknown` covers a null format. */
  formatMix: FormatMix;
}

export interface FormatMix {
  ebook: number;
  print: number;
  audio: number;
  unknown: number;
}

export interface YearStat {
  year: number;
  /** Finished books, audiobooks excluded. */
  books: number;
  /** Finished audiobooks. */
  audio: number;
  /** Session minutes falling in the year, plus the duration of untimed audiobooks finished that year. */
  minutes: number;
}

export interface FilteredData {
  /** Sessions within the selected range, joined with their book. */
  sessions: EnrichedSession[];
  byDay: DayAggregate[];
  byMonth: MonthAggregate[];
  /** Weekday × hour of day. Session-derived like every chart series, so untimed audiobooks are absent by construction. */
  byHourWeekday: HourWeekday;
  /**
   * Finished books with tracked sessions overlapping the range (see
   * BookAggregate.partial). This is the chart series: everything here has a
   * real day span. Untimed audiobooks are deliberately absent.
   */
  byBook: BookAggregate[];
  /**
   * Every finished book in the range, including untimed audiobooks placed by
   * `date_read`. This is what the table and the summary count — audiobook
   * time isn't tracked, so audiobooks belong in those two places and nowhere
   * time-based.
   */
  finishedBooks: BookAggregate[];
  summary: Summary;
}

/** Parses a YYYY-MM-DD date-only string as a UTC calendar date (no local-timezone drift). */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formats a Date's UTC calendar components as YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Time spent on a book. An audiobook's `duration` is exactly how long it took
 * to listen to, so it replaces the tracked session total; everything else
 * reports the sessions actually logged.
 *
 * Both the book table's Hours column and the overview's audiobook sentence go
 * through here — they showed two different numbers for the same audiobook
 * until they did.
 *
 * Note this is a *per-book* quantity and deliberately does not feed
 * `totalMinutes`, which stays session-derived so the per-day and per-month
 * charts agree with it: a book-level duration has no day to attach it to.
 */
export function bookMinutes(book: Book, trackedMinutes: number): number {
  return book.format === 'audio' && book.duration !== null ? book.duration : trackedMinutes;
}

function dayOffsetOf(date: Date, epoch: Date): number {
  const calendarDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((calendarDay - epoch.getTime()) / MS_PER_DAY);
}

function dateFromOffset(offset: number, epoch: Date): Date {
  return new Date(epoch.getTime() + offset * MS_PER_DAY);
}

function monthKeyOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function sum(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

function computeStats(values: number[]): Stats {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    sum: sum(values),
    mean: sum(values) / values.length,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export function enrichSessions(payload: Payload): EnrichedSession[] {
  const epoch = parseDateOnly(payload.epoch);
  const { date, book, minutes, start, end } = payload.sessions;
  return date.map((dayOffset, i) => ({
    index: i,
    dayOffset,
    date: dateFromOffset(dayOffset, epoch),
    bookIndex: book[i],
    book: payload.books[book[i]],
    minutes: minutes[i],
    start: start[i],
    end: end[i],
  }));
}

export function groupByDay(sessions: EnrichedSession[]): DayAggregate[] {
  const byDay = sessions.reduce((acc, s) => {
    const day = acc.get(s.dayOffset);
    if (day) {
      day.minutes += s.minutes;
      day.sessions.push(s);
    } else {
      acc.set(s.dayOffset, {
        dayOffset: s.dayOffset,
        date: s.date,
        minutes: s.minutes,
        sessions: [s],
      });
    }
    return acc;
  }, new Map<number, DayAggregate>());
  return [...byDay.values()].sort((a, b) => a.dayOffset - b.dayOffset);
}

export function groupByMonth(sessions: EnrichedSession[]): MonthAggregate[] {
  const byMonth = sessions.reduce((acc, s) => {
    const key = monthKeyOf(s.date);
    const minutes = acc.get(key);
    if (minutes) minutes.push(s.minutes);
    else acc.set(key, [s.minutes]);
    return acc;
  }, new Map<string, number[]>());
  return [...byMonth.entries()]
    .map(([month, values]) => ({ month, minutes: sum(values), stats: computeStats(values) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/**
 * Minutes by weekday × hour of day, for B5's time-of-day heatmap.
 *
 * A session's minutes are **split across every hour it actually spans**, not
 * charged whole to the hour it started in. This matters more than it sounds:
 * 51% of real sessions cross an hour boundary, and start-hour attribution
 * roughly doubles the apparent evening peak (Monday's 21:00 hour reads as 62%
 * of the day rather than 36%, and Tue/Thu/Sun's true peak at 22:00 disappears
 * into 21:00). Lucy's call, 2026-08-09; note it makes the figures quoted in
 * D10 — which were measured start-hour — no longer the ones on the chart.
 *
 * The split is exact rather than estimated: in the real data `end - start`
 * equals `minutes` for every session. Where it doesn't (the fixture has such a
 * row), minutes are apportioned by each hour's share of the clock span, so the
 * declared total is still preserved.
 */
export function groupByHourWeekday(sessions: EnrichedSession[]): HourWeekday {
  const minutes = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  let skipped = 0;

  for (const session of sessions) {
    if (session.start === null || session.end === null) {
      skipped++;
      continue;
    }
    // Monday-first, to match the calendar heatmap and European convention.
    const weekday = (session.date.getUTCDay() + 6) % 7;
    const start = session.start;
    // No session crosses midnight in the current data, but nothing in Boosted
    // prevents it; unwrapping keeps those minutes on the chart (in the hours
    // they were read, on the weekday the session began) instead of dropping
    // them silently.
    const end = session.end < start ? session.end + SECONDS_PER_DAY : session.end;
    const span = end - start;

    if (span <= 0) {
      minutes[weekday][Math.floor(start / SECONDS_PER_HOUR) % 24] += session.minutes;
      continue;
    }
    for (let hour = Math.floor(start / SECONDS_PER_HOUR); hour * SECONDS_PER_HOUR < end; hour++) {
      const from = Math.max(start, hour * SECONDS_PER_HOUR);
      const to = Math.min(end, (hour + 1) * SECONDS_PER_HOUR);
      minutes[weekday][hour % 24] += session.minutes * ((to - from) / span);
    }
  }

  return { minutes, skipped };
}

interface OffsetRange {
  startOffset: number;
  endOffset: number;
}

/**
 * Groups the book's *entire* session history (not clipped to the range) so a
 * book's bar always reflects its real reading span; only books overlapping
 * the range are returned, flagged `partial` when their span isn't fully
 * contained by it. Mirrors the old site's isTaskFinished/`partial` behaviour,
 * shared by the finished-books timeline and the book table.
 */
export function groupByBook(allSessions: EnrichedSession[], range: OffsetRange): BookAggregate[] {
  const byBook = allSessions.reduce((acc, s) => {
    if (!s.book.finished) return acc;
    const sessions = acc.get(s.bookIndex);
    if (sessions) sessions.push(s);
    else acc.set(s.bookIndex, [s]);
    return acc;
  }, new Map<number, EnrichedSession[]>());

  const result: BookAggregate[] = [];
  for (const [bookIndex, sessions] of byBook) {
    const offsets = sessions.map(s => s.dayOffset);
    const dayStart = Math.min(...offsets);
    const dayEnd = Math.max(...offsets);
    if (dayStart > range.endOffset || dayEnd < range.startOffset) continue;
    result.push({
      bookIndex,
      book: sessions[0].book,
      minutes: sum(sessions.map(s => s.minutes)),
      dayStart,
      dayEnd,
      days: dayEnd - dayStart + 1,
      partial: dayStart < range.startOffset || dayEnd > range.endOffset,
      hasSessions: true,
    });
  }
  return result.sort((a, b) => a.dayStart - b.dayStart);
}

/** Widens a variable-precision `date_read` to a concrete day: the first of the month or year when that is all MyBooks holds. */
export function parseDateRead(value: string): Date {
  const [year, month = '01', day = '01'] = value.split('-');
  return parseDateOnly(`${year}-${month}-${day}`);
}

/**
 * Adds the finished books that have no tracked sessions at all — untimed
 * audiobooks — positioned by `date_read`.
 *
 * They are appended here rather than inside `groupByBook` so the chart series
 * stays strictly session-derived: a book with no sessions has no span to draw,
 * and Lucy doesn't track audiobook time, so audiobooks are deliberately absent
 * from every time-based view.
 */
function addUntimedBooks(
  byBook: BookAggregate[],
  payload: Payload,
  sessionBookIndices: Set<number>,
  range: OffsetRange,
): BookAggregate[] {
  const epoch = parseDateOnly(payload.epoch);
  const result = [...byBook];

  payload.books.forEach((book, bookIndex) => {
    if (sessionBookIndices.has(bookIndex) || !book.finished) return;
    // Nothing places a finished book with neither sessions nor a date, so it
    // is skipped rather than guessed at. Doesn't occur in the current data.
    if (book.date_read === null) return;

    const offset = dayOffsetOf(parseDateRead(book.date_read), epoch);
    if (offset < range.startOffset || offset > range.endOffset) return;

    result.push({
      bookIndex,
      book,
      minutes: 0, // untracked; `bookMinutes` substitutes the audiobook's duration
      dayStart: offset,
      dayEnd: offset,
      days: 1,
      partial: false,
      hasSessions: false,
    });
  });

  return result.sort((a, b) => a.dayStart - b.dayStart);
}

/** Iterates every calendar day in the range, not just days with sessions, so missed days are counted too. */
function computeSummary(
  rangeSessions: EnrichedSession[],
  byDay: DayAggregate[],
  finishedBooks: BookAggregate[],
  range: OffsetRange,
): Summary {
  const minutesByDay = new Map(byDay.map(d => [d.dayOffset, d.minutes]));
  let daysMissed = 0;
  let daysUnderTen = 0;
  for (let offset = range.startOffset; offset <= range.endOffset; offset++) {
    const minutes = minutesByDay.get(offset) ?? 0;
    if (minutes === 0) daysMissed++;
    else if (minutes < 10) daysUnderTen++;
  }

  // Counted per book, not per session: most audiobooks have no sessions at all
  // (their time isn't tracked), and the ones that do would otherwise have their
  // `duration` added once per session.
  const audiobooks = finishedBooks.filter(b => b.book.format === 'audio');
  const audiobookMinutes = sum(audiobooks.map(b => bookMinutes(b.book, b.minutes)));

  const formatMix = finishedBooks.reduce<FormatMix>(
    (acc, b) => {
      acc[b.book.format ?? 'unknown']++;
      return acc;
    },
    { ebook: 0, print: 0, audio: 0, unknown: 0 },
  );

  return {
    // Stays session-derived so the per-day and per-month charts agree with it;
    // untimed audiobooks contribute no minutes here by construction.
    totalMinutes: sum(rangeSessions.map(s => s.minutes)),
    totalBooksFinished: finishedBooks.length,
    totalPages: sum(finishedBooks.map(b => b.book.pages ?? 0)),
    daysMissed,
    daysUnderTen,
    audiobookCount: audiobooks.length,
    audiobookMinutes,
    formatMix,
  };
}

export function computeFilteredData(
  payload: Payload,
  allSessions: EnrichedSession[],
  range: DateRange,
): FilteredData {
  const epoch = parseDateOnly(payload.epoch);
  const offsetRange: OffsetRange = {
    startOffset: dayOffsetOf(range.start, epoch),
    endOffset: dayOffsetOf(range.end, epoch),
  };

  const sessions = allSessions.filter(
    s => s.dayOffset >= offsetRange.startOffset && s.dayOffset <= offsetRange.endOffset,
  );
  const byDay = groupByDay(sessions);
  const byMonth = groupByMonth(sessions);
  const byHourWeekday = groupByHourWeekday(sessions);
  const byBook = groupByBook(allSessions, offsetRange);

  const sessionBookIndices = new Set(allSessions.map(s => s.bookIndex));
  const finishedBooks = addUntimedBooks(byBook, payload, sessionBookIndices, offsetRange);
  const summary = computeSummary(sessions, byDay, finishedBooks, offsetRange);

  return { sessions, byDay, byMonth, byHourWeekday, byBook, finishedBooks, summary };
}

/**
 * Books and minutes per calendar year, independent of the selected range —
 * the "at a glance" per-year overview sits next to the range-filtered
 * summary, not inside it.
 *
 * A book is attributed to the year of its `date_read` (finish date), not the
 * calendar year(s) its sessions fall in, so a book spanning New Year's counts
 * once, in the year it was finished. Minutes stay session-derived like
 * everywhere else, except for untimed audiobooks (no sessions at all): their
 * `duration` is added in the year they were finished, the only time anchor
 * they have. A timed audiobook's sessions are counted instead — adding its
 * `duration` on top would double-count it.
 */
export function computeYearlyStats(payload: Payload, allSessions: EnrichedSession[]): YearStat[] {
  const byYear = new Map<number, YearStat>();
  const yearStat = (year: number): YearStat => {
    let stat = byYear.get(year);
    if (!stat) {
      stat = { year, books: 0, audio: 0, minutes: 0 };
      byYear.set(year, stat);
    }
    return stat;
  };

  for (const session of allSessions) {
    yearStat(session.date.getUTCFullYear()).minutes += session.minutes;
  }

  const sessionBookIndices = new Set(allSessions.map(s => s.bookIndex));
  payload.books.forEach((book, bookIndex) => {
    if (!book.finished || book.date_read === null) return;
    const stat = yearStat(parseDateRead(book.date_read).getUTCFullYear());
    if (book.format !== 'audio') {
      stat.books++;
      return;
    }
    stat.audio++;
    if (!sessionBookIndices.has(bookIndex)) stat.minutes += bookMinutes(book, 0);
  });

  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export function useFilteredData(payload: Payload, range: DateRange): FilteredData {
  const allSessions = useMemo(() => enrichSessions(payload), [payload]);
  return useMemo(
    () => computeFilteredData(payload, allSessions, range),
    [payload, allSessions, range],
  );
}
