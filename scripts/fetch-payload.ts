// Fetches the payload from booktrack, validates it, then writes src/data/payload.json.
// Needs CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET (CI secrets, or .env.local).
import { writeFileSync } from 'node:fs';
import { validatePayload } from '../src/data/validatePayload.ts';

const SOURCE = 'https://booktrack.derlin.ch/api/public/readlog.json';
const OUT = new URL('../src/data/payload.json', import.meta.url);

const { CF_ACCESS_CLIENT_ID: id, CF_ACCESS_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) throw new Error('CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET must be set');

// Access answers a refused token with a redirect to its login page.
const res = await fetch(SOURCE, {
  headers: { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret },
  redirect: 'manual',
});
const text = await res.text();
if (res.status !== 200) throw new Error(`${SOURCE}: HTTP ${res.status}\n${text.slice(0, 300)}`);

const { epoch, books, sessions } = validatePayload(JSON.parse(text));
writeFileSync(OUT, text);
console.log(`payload.json: epoch ${epoch}, ${books.length} books, ${sessions.date.length} sessions`);
