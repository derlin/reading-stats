import type { Payload } from '../../types/payload';

/**
 * Small handwritten fixture covering every shape useFilteredData has to
 * handle: a finished ebook/print/audiobook, a DNF book, a book still in
 * progress (finished: false, all metadata null), and the empty-title,
 * all-null, multi-year edge case found in the real payload (BRIEF.md §5) —
 * a workstream-A data-quality artifact, reproduced here so the site never
 * crashes on it, not "fixed" here.
 */
export const samplePayload: Payload = {
  epoch: '2020-05-18',
  books: [
    {
      title: 'The Pragmatic Programmer',
      author: 'David Thomas',
      pages: 352,
      duration: null,
      format: 'ebook',
      dnf: false,
      rating: 4.2,
      finished: true,
      date_read: '2020-05-19',
      links: { goodreads: { id: '4099', url: 'https://www.goodreads.com/book/show/4099' } },
    },
    {
      title: 'A Book Abandoned Halfway',
      author: 'Some Author',
      pages: 200,
      duration: null,
      format: 'print',
      dnf: true,
      rating: 1.2,
      finished: true,
      date_read: '2020-05-22',
      links: {},
    },
    {
      title: 'An Audiobook',
      author: 'Audio Author',
      pages: 300,
      // Deliberately different from this book's tracked session total (600),
      // so the book table's "audiobooks report `duration`, not tracked
      // minutes" branch is actually exercised rather than coincidentally equal.
      duration: 660,
      format: 'audio',
      dnf: false,
      rating: 4,
      finished: true,
      date_read: '2020-05-29',
      links: { storygraph: { id: 'abc', url: 'https://app.thestorygraph.com/books/abc' } },
    },
    {
      title: 'Still Reading This One',
      author: null,
      pages: null,
      duration: null,
      format: null,
      dnf: false,
      rating: null,
      finished: false,
      date_read: null,
      links: {},
    },
    {
      title: '',
      author: null,
      pages: null,
      duration: null,
      format: null,
      dnf: false,
      rating: null,
      finished: false,
      date_read: null,
      links: {},
    },
    {
      // An untimed audiobook: no sessions at all, positioned solely by
      // `date_read`. Audiobook time isn't tracked in Boosted, so this is the
      // shape most audiobooks arrive in — it must reach the table and the
      // summary while staying out of every time-based chart.
      title: 'An Untimed Audiobook',
      author: 'Listened Author',
      pages: 280,
      duration: 495,
      format: 'audio',
      dnf: false,
      rating: 0,
      finished: true,
      date_read: '2021-03-14',
      links: {},
    },
  ],
  sessions: {
    date: [0, 0, 1, 3, 4, 10, 11, 40, 68, 83, 181, 635, 1143, 2043],
    book: [0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 4, 4],
    minutes: [34, 21, 5, 60, 40, 300, 300, 15, 39, 9, 56, 10, 12, 23],
    // Index 2 has no clock time: Boosted recorded none for a handful of real
    // sessions. Its `minutes` still counts everywhere; only time-of-day views
    // have to skip it.
    start: [
      41255,
      46562,
      null,
      43457,
      46036,
      41255,
      43457,
      46036,
      41255,
      43457,
      46036,
      41255,
      43457,
      46036,
    ],
    end: [
      43320,
      47797,
      null,
      44193,
      47728,
      43955,
      48197,
      46756,
      41940,
      43757,
      46456,
      41455,
      43757,
      46456,
    ],
  },
};
