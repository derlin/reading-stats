// The per-year overview: one square per calendar year, always showing every
// year regardless of the selected range, so years are comparable at a glance
// without hovering. Clicking a year sets the range to it, same destination as
// the matching preset button in the Header.

import type { YearStat } from '../data/useFilteredData';
import type { Boundaries } from '../data/useDateRange';
import { yearRange } from '../data/useDateRange';
import type { DateRange } from '../data/useFilteredData';
import { formatCount, formatDuration } from '../lib/format';
import './YearGlance.scss';

interface YearGlanceProps {
  stats: YearStat[];
  boundaries: Boundaries;
  onSelect: (range: DateRange) => void;
}

export default function YearGlance({ stats, boundaries, onSelect }: YearGlanceProps) {
  // The last year the data touches is still ongoing — parenthesised so it
  // reads as ongoing rather than the same as a closed-out year.
  const ongoingYear = boundaries.maxDate.getUTCFullYear();

  return (
    <div className="year-glance">
      {[...stats]
        .sort((a, b) => a.year - b.year)
        .map(stat => {
          const ongoing = stat.year === ongoingYear;
          return (
            <button
              key={stat.year}
              type="button"
              className={`year-glance__item${ongoing ? ' year-glance__item--ongoing' : ''}`}
              onClick={() => onSelect(yearRange(stat.year, boundaries))}
            >
              <span className={`year-glance__year${ongoing ? ' year-glance__year--ongoing' : ''}`}>
                {ongoing ? `(${stat.year})` : stat.year}
              </span>
              <span>
                <code>{formatCount(stat.books)}</code> books
              </span>
              <span>
                <code>{formatCount(stat.audio)}</code> audio
              </span>
              <span>{formatDuration(stat.minutes)}</span>
            </button>
          );
        })}
    </div>
  );
}
