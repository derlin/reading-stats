// Naming a book with its links: title linked to its primary provider, plus
// whatever other providers didn't become the title's own link. Extracted from
// the book table (the original owner of this visual language) so the reading-
// per-day chart's click detail can name a book the same way rather than
// inventing a second one.

import type { Book, BookLink as BookLinkType } from '../types/payload';
import './BookLink.scss';

// `links` is an open Record (D7), so unknown providers have to render as
// something. Known ones get their conventional two-letter shorthand; anything
// new falls back to its own first two letters rather than being dropped.
const PROVIDER_LABELS: Record<string, string> = {
  goodreads: 'GR',
  storygraph: 'SG',
};

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.slice(0, 2).toUpperCase();
}

// Which provider the title itself links to, chosen by priority rather than
// hardcoding Goodreads: `links` is an open Record (D7), some books have no
// link at all, and if a provider is ever dropped from the payload the title
// falls back to whatever remains instead of silently losing its link.
const PROVIDER_PRIORITY = ['goodreads', 'storygraph'];

export function primaryProvider(links: Record<string, BookLinkType>): string | undefined {
  return PROVIDER_PRIORITY.find(provider => provider in links) ?? Object.keys(links)[0];
}

/** The title itself, linked to its primary provider — or plain text when the book has no link at all. */
export function BookTitle({ title, link }: { title: string; link: BookLinkType | undefined }) {
  if (!link) return <span className="bookLink__title">{title}</span>;
  return (
    <a
      className="bookLink__title bookLink__title--link"
      href={link.url}
      target="_blank"
      rel="noreferrer"
    >
      {title}
    </a>
  );
}

export function ProviderLinks({
  links,
  exclude,
}: {
  links: Record<string, BookLinkType>;
  exclude: string | undefined;
}) {
  const entries = Object.entries(links).filter(([provider]) => provider !== exclude);
  if (entries.length === 0) return null;
  return (
    <span className="bookLink__links">
      {entries.map(([provider, link]) => (
        <a
          key={provider}
          className="bookLink__link"
          href={link.url}
          target="_blank"
          rel="noreferrer"
          title={provider}
        >
          {providerLabel(provider)}
        </a>
      ))}
    </span>
  );
}

/** A book named in running text: quoted linked title, plus whatever links didn't become the title's own. */
export function BookMention({ book }: { book: Book }) {
  const primary = primaryProvider(book.links);
  const title = book.title || '(untitled)';
  return (
    <>
      "<BookTitle title={title} link={primary ? book.links[primary] : undefined} />"
      <ProviderLinks links={book.links} exclude={primary} />
    </>
  );
}
