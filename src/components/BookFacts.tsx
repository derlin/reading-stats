// The formatted facts about a book, in one place because two things show
// them: the table's cells and the detail dialog. Two copies of a formatting
// expression are two things that can quietly stop agreeing.

import type { BookAggregate } from '../data/useFilteredData';
import { bookMinutes, dateFromOffset, formatDateOnly } from '../data/useFilteredData';
import { formatHoursMinutes, formatRating } from '../lib/format';
import './BookFacts.scss';

export interface BookFacts {
  hours: string;
  /**
   * '?' for a book with no tracked sessions. Only the dialog shows this; the
   * table has no column for it.
   */
  startDate: string;
  endDate: string;
  days: string | number;
  pages: string | number;
  rating: string;
}

export function bookFacts(row: BookAggregate, epoch: Date): BookFacts {
  const dateAt = (dayOffset: number) => formatDateOnly(dateFromOffset(dayOffset, epoch));
  return {
    hours: formatHoursMinutes(bookMinutes(row.book, row.minutes)),
    // An untimed audiobook has no reading span, so its `dayStart` is not a day
    // it was started on — it is `date_read` standing in for the whole book.
    // Reporting it as a start date would invent a fact, the same reason `days`
    // refuses to say 1. The end date is safe either way: that one really is
    // when the book was finished.
    startDate: row.hasSessions ? dateAt(row.dayStart) : '?',
    endDate: dateAt(row.dayEnd),
    days: row.hasSessions ? row.days : '?',
    pages: row.book.pages ?? '?',
    rating: formatRating(row.book.rating),
  };
}

export interface Fact {
  label: string;
  value: string | number;
}

/**
 * The label/value pairs as a definition list. Which facts appear is the
 * caller's business; how a label and a value look together is not, and that is
 * what lives here.
 */
export function BookFactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="bookFacts">
      {facts.map(fact => (
        <div key={fact.label} className="bookFacts__item">
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
