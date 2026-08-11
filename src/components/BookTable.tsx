// The book table — D11 calls it the best-executed element on the site, so the
// port keeps its shape exactly: uppercase micro-headers, hairline rules,
// monospace right-aligned numerals, audiobook rows tinted salmon with a
// speaker glyph, columns shed on mobile.
//
// Three things do change:
//  - Links are iterated as providers rather than hardcoding Goodreads (D7);
//    nine books have no Goodreads link while 572 have StoryGraph.
//  - DNF is a badge here rather than a chart (D10) — 3 books in the library.
//  - The ⏰ emoji that stood in for a mobile sort control (a D11 defect) is
//    replaced by a labelled select. Sorting was only ever half of what the
//    shed columns needed, though: the select can order the rows by a hidden
//    column but it cannot show you the value, so every row now also carries a
//    chevron that expands an extra <tr> holding whatever the layout dropped.

import { Fragment, useMemo, useState } from 'react';
import type { BookAggregate } from '../data/useFilteredData';
import { bookMinutes, formatDateOnly } from '../data/useFilteredData';
import type { Book } from '../types/payload';
import { formatHoursMinutes } from '../lib/format';
import { BookTitle, ProviderLinks, primaryProvider } from './BookLink';
import './BookTable.scss';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type SortKey = 'title' | 'author' | 'minutes' | 'dayEnd' | 'days' | 'pages' | 'rating';

interface Column {
  key: SortKey;
  name: string;
}

const COLUMNS: Column[] = [
  { key: 'title', name: 'Books' },
  { key: 'author', name: 'Authors' },
  { key: 'minutes', name: 'Hours' },
  { key: 'dayEnd', name: 'End Date' },
  { key: 'days', name: 'Days' },
  { key: 'pages', name: 'Pages' },
  { key: 'rating', name: 'Rating' },
];

/**
 * Ratings are continuous, not stars (D10): 279 of 616 are arbitrary
 * one-decimal values, so they render as the number itself — never as a
 * star histogram. `0` is a real rating and must not read as "unrated",
 * which is why this tests for null rather than falsiness.
 */
function formatRating(rating: number | null): string {
  return rating === null ? '?' : rating.toFixed(1);
}

/**
 * The four values that the narrow layout takes away — Hours, End Date, Days
 * and Rating — computed once per row and handed to both the cells and the
 * expanded detail underneath. They are shared rather than written out twice
 * for the same reason `sortValue` reuses `bookMinutes`: two copies of a
 * formatting expression are two things that can quietly stop agreeing, and a
 * detail panel whose whole job is to stand in for a hidden cell is exactly
 * where that would go unnoticed.
 */
interface ShedValues {
  hours: string;
  endDate: string;
  days: string | number;
  rating: string;
}

function shedValues(row: BookAggregate, epoch: Date): ShedValues {
  return {
    hours: formatHoursMinutes(bookMinutes(row.book, row.minutes)),
    endDate: formatDateOnly(new Date(epoch.getTime() + row.dayEnd * MS_PER_DAY)),
    // An untimed audiobook has no reading span — 1 day would be a lie.
    days: row.hasSessions ? row.days : '?',
    rating: formatRating(row.book.rating),
  };
}

/**
 * Tapping anywhere in a row opens it, because the chevron alone is a thumb-sized
 * problem: it is a single glyph at the edge of a 44%-wide column, and on a phone
 * the row is the target the reader actually aims at.
 *
 * The row already holds things that own their clicks, though — the title link,
 * the provider chips, and the chevron itself — and they have to keep them. That
 * is tested for here, on the row, rather than by stopping propagation inside
 * each one: the links are generated from an open Record of providers (D7), so
 * the set of anchors in a cell is not fixed, and a rule that lives on the row
 * cannot be forgotten by whatever gets added to a cell later.
 */
const ROW_OWN_CONTROLS = 'a, .bookTable__expand';

function clickedRowControl(target: EventTarget): boolean {
  return target instanceof Element && target.closest(ROW_OWN_CONTROLS) !== null;
}

function sortValue(row: BookAggregate, key: SortKey): string | number | null {
  switch (key) {
    case 'title':
      return row.book.title;
    case 'author':
      return row.book.author;
    case 'pages':
      return row.book.pages;
    case 'rating':
      return row.book.rating;
    case 'minutes':
      // Must match what the cell shows, or the sort silently disagrees with it.
      return bookMinutes(row.book, row.minutes);
    default:
      return row[key];
  }
}

/** Nulls sort last in both directions — an unknown page count is not "smallest". */
function compare(a: BookAggregate, b: BookAggregate, key: SortKey, ascending: boolean): number {
  const left = sortValue(a, key);
  const right = sortValue(b, key);
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  const direction = ascending ? 1 : -1;
  return typeof left === 'string' && typeof right === 'string'
    ? left.localeCompare(right as string) * direction
    : (Number(left) - Number(right)) * direction;
}

/**
 * Title, DNF badge, and whatever providers the title didn't take — preceded on
 * narrow screens by the control that opens the row's detail.
 *
 * The chevron is the first child of the cell on every row, including
 * audiobooks, so the chevrons form a straight column down the left edge of the
 * table. That is why the audiobook speaker is emitted here as an element
 * rather than left as the `td:first-child::before` it used to be: a
 * pseudo-element on the cell would always paint ahead of the button and push
 * exactly the audio rows' chevrons out of line (see BookTable.scss).
 */
function TitleCell({
  book,
  detailId,
  expanded,
  onToggle,
}: {
  book: Book;
  detailId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const primary = primaryProvider(book.links);
  const title = book.title || '(untitled)';
  return (
    <td className="text">
      {/*
        The row as a whole is what a thumb hits (see `clickedRowControl`), but
        the control is a real button all the same: a click handler on a <tr> is
        not focusable and announces nothing, so without this the detail would be
        unreachable by keyboard and invisible to a screen reader. The row tap is
        the enhancement, this is the control — which is also why the row needs no
        role or tabindex of its own. `aria-controls` names the detail row, which
        only exists while it is open — with 616 books, rendering every panel up
        front just to keep the id resolvable would double the table's DOM for
        the sake of a hint that `aria-expanded` already carries.
      */}
      <button
        type="button"
        className="bookTable__expand"
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={expanded ? `Hide details for ${title}` : `Show details for ${title}`}
        onClick={onToggle}
      >
        {/* Text glyphs rather than an inline SVG: the table already speaks in
            them (the sort arrows, the mobile direction toggle), and the ⓘ SVG
            in InfoPopover is a lone case elsewhere on the page. */}
        {expanded ? '▾' : '▸'}
      </button>
      {book.format === 'audio' && <span className="bookTable__audio" aria-hidden="true" />}
      <BookTitle title={title} link={primary ? book.links[primary] : undefined} />
      {book.dnf && (
        <span className="bookTable__badge" title="Did not finish">
          DNF
        </span>
      )}
      <ProviderLinks links={book.links} exclude={primary} />
    </td>
  );
}

/**
 * What the row looks like when it is opened: one extra `<tr>` spanning the
 * whole table, holding the label/value pairs for the columns this width has
 * dropped. A row rather than a popover because the values belong to the book
 * and should push the table apart where the book is, instead of floating over
 * the rows below it; `table-layout: fixed` is already in force at these widths
 * and a single spanning cell does not disturb it.
 *
 * Hours is listed unconditionally here and hidden by the stylesheet until it
 * is actually missing from the table — see the `--hours` rules in
 * BookTable.scss. Which columns are gone is a question about widths, and the
 * widths are all declared over there.
 */
function DetailRow({
  id,
  className,
  values,
}: {
  id: string;
  className: string;
  values: ShedValues;
}) {
  return (
    <tr id={id} className={className}>
      <td colSpan={COLUMNS.length}>
        <dl className="bookTable__detail">
          <div className="bookTable__detailItem bookTable__detailItem--hours">
            <dt>Hours</dt>
            <dd>{values.hours}</dd>
          </div>
          <div className="bookTable__detailItem">
            <dt>End Date</dt>
            <dd>{values.endDate}</dd>
          </div>
          <div className="bookTable__detailItem">
            <dt>Days</dt>
            <dd>{values.days}</dd>
          </div>
          <div className="bookTable__detailItem">
            <dt>Rating</dt>
            <dd>{values.rating}</dd>
          </div>
        </dl>
      </td>
    </tr>
  );
}

interface BookTableProps {
  byBook: BookAggregate[];
  epoch: Date;
}

export default function BookTable({ byBook, epoch }: BookTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('dayEnd');
  const [ascending, setAscending] = useState(false);
  // One book at a time, so the state is the open row's index rather than a set
  // of them: with 616 rows a screenful of half-open panels would be a worse
  // read than the table it is trying to rescue, and closing the previous one
  // costs the reader nothing they cannot get back with one tap.
  const [expanded, setExpanded] = useState<number | null>(null);

  const rows = useMemo(
    () => [...byBook].sort((a, b) => compare(a, b, sortBy, ascending)),
    [byBook, sortBy, ascending],
  );

  if (byBook.length === 0) return <p>No book finished in this interval.</p>;

  const toggleSort = (key: SortKey) => {
    if (key === sortBy) setAscending(!ascending);
    else {
      setSortBy(key);
      setAscending(true);
    }
  };

  // The pre-rewrite table mapped ascending to a ↓ glyph, so its default
  // newest-first sort was labelled ↑. Corrected here rather than carried over.
  const sortClass = (key: SortKey) =>
    `sortHandle${sortBy === key ? ` sorted ${ascending ? 'up' : 'down'}` : ''}`;

  return (
    <div className="bookTable">
      <label className="bookTable__mobileSort">
        Sort by
        <select
          value={sortBy}
          onChange={e => {
            setSortBy(e.target.value as SortKey);
            setAscending(false);
          }}
        >
          {COLUMNS.map(column => (
            <option key={column.key} value={column.key}>
              {column.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="bookTable__direction"
          aria-label={ascending ? 'Sort descending' : 'Sort ascending'}
          onClick={() => setAscending(!ascending)}
        >
          {ascending ? '↑' : '↓'}
        </button>
      </label>

      <table>
        <thead>
          <tr>
            {COLUMNS.map(column => (
              <th
                key={column.key}
                className={sortClass(column.key)}
                aria-sort={
                  sortBy === column.key ? (ascending ? 'ascending' : 'descending') : 'none'
                }
                onClick={() => toggleSort(column.key)}
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const values = shedValues(row, epoch);
            const isExpanded = expanded === row.bookIndex;
            const detailId = `book-detail-${row.bookIndex}`;
            // The detail row repeats its book's row classes so that the salmon
            // audiobook tint and the faded `partial` treatment run through the
            // pair: an expanded row that changed colour halfway down would read
            // as two unrelated rows rather than one opened book.
            const rowClass =
              (row.book.format === 'audio' ? 'audio ' : '') + (row.partial ? 'partial' : '');
            return (
              <Fragment key={row.bookIndex}>
                <tr
                  className={rowClass}
                  onClick={event => {
                    if (clickedRowControl(event.target)) return;
                    setExpanded(isExpanded ? null : row.bookIndex);
                  }}
                >
                  <TitleCell
                    book={row.book}
                    detailId={detailId}
                    expanded={isExpanded}
                    onToggle={() => setExpanded(isExpanded ? null : row.bookIndex)}
                  />
                  <td className="text">{row.book.author ?? '?'}</td>
                  <td className="mono right">{values.hours}</td>
                  <td className="mono">{values.endDate}</td>
                  <td className="mono right">{values.days}</td>
                  <td className="mono right">{row.book.pages ?? '?'}</td>
                  <td className="mono right">{values.rating}</td>
                </tr>
                {isExpanded && (
                  <DetailRow
                    id={detailId}
                    className={`bookTable__detailRow ${rowClass}`}
                    values={values}
                  />
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
