// A book cover, or a rectangle with the title in it when there isn't one.
// There is no ISBN in the payload, so there is no second source to fall back
// to: a cover either loads from its stored URL or the placeholder stands in.

import { useState, type CSSProperties } from 'react';
import { sizedCoverUrl } from '../lib/covers';
import './BookCover.scss';

/**
 * Placeholder titles are set in container units (`1cqi`), so one scale covers
 * every width the tile is given. The steps are by title length rather than
 * continuous because the thing being avoided is a six-word title overflowing
 * six clamped lines, and that only has a handful of distinct answers.
 */
function fontScale(length: number): number {
  if (length <= 15) return 16;
  if (length <= 30) return 12;
  if (length <= 60) return 9;
  return 7;
}

interface BookCoverProps {
  title: string;
  coverImage: string | null;
  /** CSS pixel width the cover renders at. The URL is sized to it, and to 2x for retina. */
  width: number;
}

export default function BookCover({ title, coverImage, width }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!coverImage || failed) {
    return (
      <div className="bookCover bookCover--fake">
        <span
          className="bookCover__title"
          style={{ '--cover-font-scale': fontScale(title.length) } as CSSProperties}
        >
          {title}
        </span>
      </div>
    );
  }

  const src = sizedCoverUrl(coverImage, width);
  const retina = sizedCoverUrl(coverImage, width * 2);

  return (
    <div className={`bookCover${loaded ? '' : ' bookCover--loading'}`}>
      {/*
        `alt` is the title rather than empty, because the only thing wrapping
        this is a control — a grid tile or a table row — and an empty alt would
        leave it with no accessible name at all.

        `loading="lazy"` is what makes the grid affordable: without it every
        cover in the range is fetched on load. It pairs with the
        `content-visibility` rule on the tile (BookGrid.scss), and it goes on
        working inside the grid's own scrolling panel — the browser measures
        lazy candidates against the nearest scrollport, not only the document's.
      */}
      <img
        src={src}
        srcSet={retina === src ? undefined : `${src} 1x, ${retina} 2x`}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
