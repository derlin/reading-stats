// The book table (D11): uppercase micro-headers, hairline rules, monospace
// right-aligned numerals, audiobook rows tinted salmon with a speaker glyph,
// columns shed on mobile.
//
// The select orders the rows by a column the width has dropped, but it cannot
// show the value. Clicking a row opens the shared detail dialog, which carries
// every value whatever this width kept.

import { useMemo, useState } from 'react';
import type { BookAggregate } from '../data/useFilteredData';
import { bookMinutes } from '../data/useFilteredData';
import { bookTitle } from '../lib/format';
import type { Book } from '../types/payload';
import BookDialog from './BookDialog';
import { BookTitle, ProviderLinks, primaryProvider } from './BookLink';
import { bookFacts } from './BookFacts';
import DnfBadge from './DnfBadge';
import './BookTable.scss';

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

/** Links inside the row keep their own click/Enter instead of opening the dialog. */
function clickedRowControl(target: EventTarget): boolean {
  return target instanceof Element && target.closest('a') !== null;
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

function TitleCell({ book }: { book: Book }) {
  const primary = primaryProvider(book.links);
  const title = bookTitle(book);
  return (
    <td className="text">
      {book.format === 'audio' && <span className="bookTable__audio" aria-hidden="true" />}
      <BookTitle title={title} link={primary ? book.links[primary] : undefined} />
      {book.dnf && <DnfBadge className="dnfBadge--inline" />}
      <ProviderLinks links={book.links} exclude={primary} />
    </td>
  );
}

interface BookTableProps {
  byBook: BookAggregate[];
  epoch: Date;
}

export default function BookTable({ byBook, epoch }: BookTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('dayEnd');
  const [ascending, setAscending] = useState(false);
  const [opened, setOpened] = useState<BookAggregate | null>(null);

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
            const facts = bookFacts(row, epoch);
            const rowClass = `${row.book.format === 'audio' ? 'audio ' : ''}${
              row.partial ? 'partial' : ''
            }`.trim();
            return (
              <tr
                key={row.bookIndex}
                className={rowClass}
                // No role="button": that would pull the row out of the table tree.
                tabIndex={0}
                aria-haspopup="dialog"
                aria-label={`Show details for ${bookTitle(row.book)}`}
                onClick={event => {
                  if (clickedRowControl(event.target)) return;
                  setOpened(row);
                }}
                onKeyDown={event => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  if (clickedRowControl(event.target)) return;
                  event.preventDefault(); // Space would scroll the page
                  setOpened(row);
                }}
              >
                <TitleCell book={row.book} />
                <td className="text">{row.book.author ?? '?'}</td>
                <td className="mono right">{facts.hours}</td>
                <td className="mono">{facts.endDate}</td>
                <td className="mono right">{facts.days}</td>
                <td className="mono right">{facts.pages}</td>
                <td className="mono right">{facts.rating}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <BookDialog row={opened} epoch={epoch} onClose={() => setOpened(null)} />
    </div>
  );
}
