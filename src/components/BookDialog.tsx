// A book's details, as a native modal `<dialog>`. The one detail surface on
// the site: the cover grid opens it from a tile, and the table from a row.
//
// Native rather than a hand-rolled overlay because `showModal()` already does
// the parts that are easy to get wrong: Escape closes it, focus is trapped
// inside and handed back to whatever opened it, and the page behind goes
// inert. The only piece it does not bring is dismissing on a backdrop click.

import { useEffect, useRef } from 'react';
import type { BookAggregate } from '../data/useFilteredData';
import { bookTitle } from '../lib/format';
import { BookFactList, bookFacts } from './BookFacts';
import BookCover from './BookCover';
import { ProviderLinks } from './BookLink';
import DnfBadge from './DnfBadge';
import './BookDialog.scss';

/** The cover width the dialog renders at, which is most of the reason to open one. */
const COVER_WIDTH = 200;

function DialogBody({ row, epoch }: { row: BookAggregate; epoch: Date }) {
  const { book } = row;
  const title = bookTitle(book);
  const facts = bookFacts(row, epoch);

  return (
    <div className="bookDialog__body">
      <BookCover title={title} coverImage={book.cover_image} width={COVER_WIDTH} />
      <div className="bookDialog__info">
        <h3 className="bookDialog__title">
          {book.format === 'audio' && <span className="bookDialog__audio" aria-hidden="true" />}
          {title}
          {book.dnf && <DnfBadge className="dnfBadge--inline" />}
        </h3>
        <p className="bookDialog__author">{book.author ?? 'unknown author'}</p>
        {/*
          Every provider, spelled out. Everywhere else on the site the title
          takes the primary provider as its own link and only the leftovers
          become chips, which is right where space is tight but wrong here: it
          leaves one provider named and the other hidden behind a title that
          doesn't say where it goes. The dialog has the room to name both.
        */}
        <ProviderLinks links={book.links} full />
        {/* Every fact, since neither a tile nor a narrowed table row shows any. */}
        <BookFactList
          facts={[
            { label: 'Hours', value: facts.hours },
            { label: 'Start Date', value: facts.startDate },
            { label: 'End Date', value: facts.endDate },
            { label: 'Days', value: facts.days },
            { label: 'Pages', value: facts.pages },
            { label: 'Rating', value: facts.rating },
          ]}
        />
      </div>
    </div>
  );
}

interface BookDialogProps {
  /** The open book, or null when the dialog should be closed. */
  row: BookAggregate | null;
  epoch: Date;
  onClose: () => void;
}

export default function BookDialog({ row, epoch, onClose }: BookDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (row && !dialog.open) dialog.showModal();
    else if (!row && dialog.open) dialog.close();
  }, [row]);

  return (
    // `onClose` fires however the dialog went away — Escape, the close button,
    // or `close()` itself — so it is the one place the open book is cleared.
    // The click handler only ever sees the backdrop: a click on the content
    // targets the content, and only the backdrop targets the element.
    //
    // The backdrop is not a control and cannot be focused or reached by
    // keyboard at all, so the click has no keyboard counterpart to pair with.
    // Its keyboard equivalent is Escape, which `showModal()` binds itself and
    // which arrives here through `onClose` above.
    //
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is unfocusable; Escape is its keyboard path
    <dialog
      ref={ref}
      className="bookDialog"
      onClose={onClose}
      onClick={event => {
        if (event.target === ref.current) onClose();
      }}
    >
      <button type="button" className="bookDialog__close" aria-label="Close" onClick={onClose}>
        ×
      </button>
      {/* Keyed by book so the cover's own loaded/failed state starts over when
          the dialog is re-pointed at a different one. */}
      {row && <DialogBody key={row.bookIndex} row={row} epoch={epoch} />}
    </dialog>
  );
}
