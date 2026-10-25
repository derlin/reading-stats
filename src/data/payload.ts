// Loads the payload and checks it against the contract at module load.
//
// A plain JSON import is not enough: TypeScript widens JSON string literals to
// `string`, so `format: "ebook"` can never satisfy `BookFormat | null`. Casting
// the import would silence the error and, with it, the guarantee.

import raw from './payload.json';
import { validatePayload } from './validatePayload.ts';

export const payload = validatePayload(raw);
