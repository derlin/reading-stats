// Loads the generated payload and checks it against the D7 contract.
//
// D7 says a shape mismatch between the Python generator and the TypeScript
// loader should break the build rather than the page, and calls that the main
// reason the rewrite is typed. A plain JSON import does *not* deliver that:
// TypeScript widens JSON string literals to `string`, so `format: "ebook"`
// infers as `string` and can never structurally satisfy `BookFormat | null`.
// Casting the import would silence the error and, with it, the guarantee.
//
// So the check happens here instead, once, at module load. It throws on the
// first violation with the offending book index and field, which is what makes
// a pipeline change that quietly drops or renames a field noticeable rather
// than something that surfaces later as a blank chart.

import type { Book, BookFormat, BookLink, Payload, Sessions } from '../types/payload';
import raw from './payload.json';

const FORMATS: readonly string[] = ['ebook', 'print', 'audio'] satisfies BookFormat[];
const SESSION_COLUMNS = ['date', 'book', 'minutes', 'start', 'end'] as const;

function fail(what: string): never {
  throw new Error(`payload.json does not match the D7 contract: ${what}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Optional fields are genuinely nullable, not merely absent — BRIEF §6 shows the source file omits fields it declares required, so A1 normalises them to null. */
function nullableNumber(value: unknown, where: string): number | null {
  if (value !== null && typeof value !== 'number') fail(`${where} must be a number or null`);
  return value as number | null;
}

function checkLinks(value: unknown, where: string): Record<string, BookLink> {
  if (!isRecord(value)) fail(`${where} must be an object`);
  for (const [provider, link] of Object.entries(value)) {
    if (!isRecord(link) || typeof link.id !== 'string' || typeof link.url !== 'string') {
      fail(`${where}.${provider} must be {id: string, url: string}`);
    }
  }
  return value as Record<string, BookLink>;
}

function checkBook(value: unknown, index: number): Book {
  const where = `books[${index}]`;
  if (!isRecord(value)) fail(`${where} must be an object`);

  if (typeof value.title !== 'string') fail(`${where}.title must be a string`);
  if (value.author !== null && typeof value.author !== 'string') {
    fail(`${where}.author must be a string or null`);
  }
  if (typeof value.dnf !== 'boolean') fail(`${where}.dnf must be a boolean`);
  if (typeof value.finished !== 'boolean') fail(`${where}.finished must be a boolean`);
  if (value.format !== null && !FORMATS.includes(value.format as string)) {
    fail(
      `${where}.format must be one of ${FORMATS.join('/')} or null, got ${String(value.format)}`,
    );
  }

  // Variable precision by design (BRIEF §6) — accept all three forms and let
  // the loader widen them, but reject anything that isn't one of them.
  if (value.date_read !== null && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(value.date_read))) {
    fail(
      `${where}.date_read must be YYYY-MM-DD, YYYY-MM, YYYY or null, got ${String(value.date_read)}`,
    );
  }

  nullableNumber(value.pages, `${where}.pages`);
  nullableNumber(value.duration, `${where}.duration`);
  // Ratings are continuous and `0` is a real rating (D10) — only null means unrated.
  nullableNumber(value.rating, `${where}.rating`);
  checkLinks(value.links, `${where}.links`);

  return value as unknown as Book;
}

function checkSessions(value: unknown, bookCount: number): Sessions {
  if (!isRecord(value)) fail('sessions must be an object');

  let length: number | null = null;
  for (const column of SESSION_COLUMNS) {
    const values = value[column];
    if (!Array.isArray(values)) fail(`sessions.${column} must be an array`);
    if (length === null) length = values.length;
    // Columnar layout: index i across all five columns describes one session,
    // so ragged columns would silently misalign every session after the gap.
    else if (values.length !== length) {
      fail(`sessions.${column} has ${values.length} entries, expected ${length}`);
    }
    // start/end are nullable — Boosted recorded no clock time for a few
    // sessions. date/book/minutes are not: without those a session means
    // nothing, so a null there is a pipeline bug worth failing on.
    const nullable = column === 'start' || column === 'end';
    const badIndex = values.findIndex(v =>
      nullable ? v !== null && typeof v !== 'number' : typeof v !== 'number',
    );
    if (badIndex !== -1) {
      fail(`sessions.${column}[${badIndex}] must be a number${nullable ? ' or null' : ''}`);
    }
  }

  const books = value.book as number[];
  const outOfRange = books.findIndex(b => !Number.isInteger(b) || b < 0 || b >= bookCount);
  if (outOfRange !== -1) {
    fail(
      `sessions.book[${outOfRange}] is ${books[outOfRange]}, outside books[0..${bookCount - 1}]`,
    );
  }

  return value as unknown as Sessions;
}

export function validatePayload(value: unknown): Payload {
  if (!isRecord(value)) fail('root must be an object');
  if (typeof value.epoch !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.epoch)) {
    fail('epoch must be a YYYY-MM-DD string');
  }
  if (!Array.isArray(value.books)) fail('books must be an array');

  const books = value.books.map(checkBook);
  const sessions = checkSessions(value.sessions, books.length);

  return { epoch: value.epoch, books, sessions };
}

export const payload = validatePayload(raw);
