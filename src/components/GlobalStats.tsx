// The overview, as prose (D11): statistics are accent-coloured monospace
// numerals sitting inside real sentences, deliberately not a row of stat
// tiles. Kept from the pre-rewrite site almost verbatim; the format-mix
// sentence is the one addition (D10, which cut it as a dedicated chart).

import type { DateRange, Summary } from '../data/useFilteredData';
import {
  formatCalendarSpan,
  formatCount,
  formatElapsedMinutes,
  formatLongDate,
} from '../lib/format';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface GlobalStatsProps {
  summary: Summary;
  range: DateRange;
}

function Num({ value }: { value: number }) {
  return <code>{formatCount(value)}</code>;
}

export default function GlobalStats({ summary, range }: GlobalStatsProps) {
  const from = <i>{formatLongDate(range.start)}</i>;
  const to = <i>{formatLongDate(range.end)}</i>;
  // Both bounds are inclusive, so the span runs to the day *after* the end.
  const span = formatCalendarSpan(range.start, new Date(range.end.getTime() + MS_PER_DAY));

  if (summary.totalMinutes === 0) {
    return (
      <p>
        From {from} to {to} ({span}), I read nothing at all.
      </p>
    );
  }

  const { ebook, print } = summary.formatMix;

  return (
    <div>
      <p>
        From {from} to {to} ({span}), I finished{' '}
        <b>
          <Num value={print + ebook} /> books{' '}
        </b>
        (<Num value={print} /> in print format, <Num value={ebook} /> in digital format).
      </p>
      <p>
        I read{' '}
        {summary.totalPages > 0 && (
          <>
            about <Num value={summary.totalPages} /> pages in{' '}
          </>
        )}
        <Num value={summary.totalMinutes} /> minutes, which is equivalent to{' '}
        <b>{formatElapsedMinutes(summary.totalMinutes)}</b> non-stop reading. I missed{' '}
        <Num value={summary.daysMissed} /> days (no reading at all), and read less than ten minutes{' '}
        <Num value={summary.daysUnderTen} /> times.
      </p>
      {summary.audiobookCount > 0 && (
        <>
          <p>
            I also listened to audiobooks for <Num value={summary.audiobookMinutes} /> minutes,
            which is equivalent to <b>{formatElapsedMinutes(summary.audiobookMinutes)}</b>.
          </p>
          <p>
            This makes a total of{' '}
            <b>
              <Num value={summary.totalBooksFinished} /> (audio)books
            </b>
            .
          </p>
        </>
      )}
    </div>
  );
}
