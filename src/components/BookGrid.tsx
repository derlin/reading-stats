// The cover grid: every finished book in the selected range as a tile, grouped
// by the year it was finished, with its rating as a bar underneath.
//
// It answers a question the rest of the page cannot. The Gantt shows *when*
// books were read and the table shows what they were, but rating has only ever
// existed here as a number in the table's last column. The bar gives it a
// shape you can read across a whole year at a glance.
//
// Deliberately the same `finishedBooks` the table is given rather than a
// selection of its own, so the grid and the table can never show a different
// set of books for the same range.

import { Fragment, useMemo, useState } from 'react';
import type { BookAggregate, DateRange } from '../data/useFilteredData';
import { dateFromOffset } from '../data/useFilteredData';
import { bookTitle, formatCount, formatRating } from '../lib/format';
import { isPerfectRating, RATING_FILTERS, ratingBarFraction, ratingColor } from '../lib/rating';
import BookCover from './BookCover';
import BookDialog from './BookDialog';
import DnfBadge from './DnfBadge';
import './BookGrid.scss';

/**
 * The width a tile's cover URL is sized to. Tiles are `minmax(92px, 1fr)`, so
 * their real width floats between 92 and ~100 depending on how the row
 * divides; 100 covers that, and BookCover asks for 200 as the 2x candidate.
 */
const COVER_WIDTH = 100;

interface YearGroup {
  year: number;
  books: BookAggregate[];
}

/**
 * Newest year first, and newest book first inside each year — the same order
 * the table defaults to, so switching between the two views doesn't reshuffle
 * the books.
 *
 * Grouped on `dayEnd` rather than on `book.date_read` because that is what the
 * table's End Date column shows. The two agree for every book with sessions
 * and would quietly diverge for an untimed audiobook, whose whole position in
 * time is a `date_read` at whatever precision MyBooks held.
 *
 * The year is then clamped to the selected range, which is not cosmetic.
 * `groupByBook` returns every book whose span *overlaps* the range, carrying
 * its real unclipped `dayEnd` — so a book read from 2021-12-14 to 2022-01-07
 * would hang a one-book "2022" heading under a range that is entirely 2021.
 * Such a book belongs to the last year the range actually covers; that it
 * spills past the edge is what `partial` already says, by fading the tile.
 */
function groupByYear(rows: BookAggregate[], epoch: Date, range: DateRange): YearGroup[] {
  const firstYear = range.start.getUTCFullYear();
  const lastYear = range.end.getUTCFullYear();
  const groups = new Map<number, BookAggregate[]>();

  for (const row of [...rows].sort((a, b) => b.dayEnd - a.dayEnd)) {
    const ended = dateFromOffset(row.dayEnd, epoch).getUTCFullYear();
    const year = Math.min(lastYear, Math.max(firstYear, ended));
    const books = groups.get(year);
    if (books) books.push(row);
    else groups.set(year, [row]);
  }
  return [...groups.entries()]
    .map(([year, books]) => ({ year, books }))
    .sort((a, b) => b.year - a.year);
}

function Tile({ row, onOpen }: { row: BookAggregate; onOpen: (row: BookAggregate) => void }) {
  const { book } = row;
  const title = bookTitle(book);
  const rating = book.rating;

  // What a pointer gets for free, before deciding whether to open anything.
  const caption =
    `${title}${book.author ? ` by ${book.author}` : ''}` +
    (rating === null ? '' : ` (${formatRating(rating)})`);

  // Faded for a book whose reading ran past the edge of the selected range,
  // the same treatment `tr.partial` gets in the table — the two views show the
  // same books and must not disagree about which of them are only half here.
  const className = `bookGrid__tile${row.partial ? ' bookGrid__tile--partial' : ''}`;

  // A button rather than a link to the provider: a cover is not enough to
  // decide on, and sending the reader off-site to find out how long a book took
  // is a worse answer than showing them. The provider links live in the dialog,
  // where they are labelled — which also means a book with no links at all (D7)
  // needs no special case here.
  return (
    <button
      type="button"
      className={className}
      title={caption}
      aria-haspopup="dialog"
      onClick={() => onOpen(row)}
    >
      {book.dnf && <DnfBadge className="bookGrid__dnf" />}
      {/* A star rather than a frame around the tile: at one tile in eight a
          frame stops reading as "look at this one" and starts reading as a
          second kind of tile. */}
      {isPerfectRating(rating) && (
        <span className="bookGrid__star" aria-hidden="true">
          ★
        </span>
      )}
      {book.format === 'audio' && <span className="bookGrid__audio" aria-hidden="true" />}
      <BookCover title={title} coverImage={book.cover_image} width={COVER_WIDTH} />
      {/* An unrated book gets no track at all, rather than an empty one: an
          empty track is what a rating of 0 looks like, and those are books that
          really were read and really were hated. */}
      {rating !== null && (
        <span className="bookGrid__rating">
          <span
            className="bookGrid__ratingFill"
            style={{
              width: `${ratingBarFraction(rating) * 100}%`,
              background: ratingColor(rating),
            }}
          />
        </span>
      )}
    </button>
  );
}

interface BookGridProps {
  byBook: BookAggregate[];
  epoch: Date;
  /** The selected range, which bounds the year headings. See `groupByYear`. */
  range: DateRange;
}

export default function BookGrid({ byBook, epoch, range }: BookGridProps) {
  const [minRating, setMinRating] = useState<number | null>(null);
  const [opened, setOpened] = useState<BookAggregate | null>(null);

  const { groups, total } = useMemo(() => {
    // `min` is a floor on the rating, so an unrated book cannot satisfy any of
    // them — it is filtered out rather than kept as a maybe.
    const kept =
      minRating === null
        ? byBook
        : byBook.filter(row => row.book.rating !== null && row.book.rating >= minRating);
    return { groups: groupByYear(kept, epoch, range), total: kept.length };
  }, [byBook, epoch, range, minRating]);

  if (byBook.length === 0) return <p>No book finished in this interval.</p>;

  return (
    <div className="bookGrid">
      <div className="bookGrid__filter">
        <span>Rating</span>
        {RATING_FILTERS.map(filter => (
          <button
            key={filter.label}
            type="button"
            className={`btn${minRating === filter.min ? ' focus' : ''}`}
            aria-pressed={minRating === filter.min}
            onClick={() => setMinRating(filter.min)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <p>No book in this interval is rated that highly.</p>
      ) : (
        // One scroll box around every year rather than one per year, so the
        // headings scroll with their tiles and stick to the top on the way
        // past. Capped in the stylesheet: a few hundred covers is a section
        // long enough to bury everything under it.
        <div className="bookGrid__scroll">
          {groups.map(group => (
            <Fragment key={group.year}>
              <h3 className="bookGrid__year">
                {group.year}
                <span className="bookGrid__count">
                  <code>{formatCount(group.books.length)}</code> books
                </span>
              </h3>
              <div className="bookGrid__tiles">
                {group.books.map(row => (
                  <Tile key={row.bookIndex} row={row} onOpen={setOpened} />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      )}

      <BookDialog row={opened} epoch={epoch} onClose={() => setOpened(null)} />
    </div>
  );
}
