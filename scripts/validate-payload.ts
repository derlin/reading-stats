// Usage: node scripts/validate-payload.ts <file>. Fails on a payload that breaks the contract.
import { readFileSync } from 'node:fs';
import { validatePayload } from '../src/data/validatePayload.ts';

const file = process.argv[2];
if (!file) throw new Error('usage: validate-payload.ts <file>');
const { epoch, books, sessions } = validatePayload(JSON.parse(readFileSync(file, 'utf8')));
console.log(`${file}: epoch ${epoch}, ${books.length} books, ${sessions.date.length} sessions`);
