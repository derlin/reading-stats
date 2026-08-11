// Regenerates the subset woff2 files in src/assets/fonts/.
//
// Run with:  npm i --no-save dejavu-fonts-ttf@2.37.3 subset-font@2.5.0 && node other/build-fonts.mjs
//
// Neither package is a dependency of the site: the fonts are committed, so
// this runs once when the range below needs widening (a title in a script the
// subset doesn't cover) or when DejaVu itself is upgraded. Full DejaVu Sans
// Mono is ~140KB per face in woff2; these ranges cut it to ~25KB.
//
// Why DejaVu and not Menlo: Menlo is Apple's, bundled with macOS and not
// licensed for redistribution. It is a build of Bitstream Vera Sans Mono, and
// DejaVu is the open continuation of that same design — same letterforms, a
// license that allows shipping. LICENSE.txt next to the woff2 files is
// required by those terms and must stay there.

import { readFileSync, writeFileSync } from 'node:fs';
import subsetFont from 'subset-font';

const RANGES = [
  [0x20, 0x7e], // ASCII
  [0xa0, 0xff], // Latin-1: accented French, ø, ç
  [0x100, 0x17f], // Latin Extended-A
  [0x1e00, 0x1eff], // Latin Extended Additional — one Vietnamese title (ế, ễ)
  [0x2000, 0x206f], // General Punctuation: the curly apostrophe in titles, dashes, ellipsis
  [0x2190, 0x21ff], // Arrows — the table's sort glyphs and the date range's →
];

// Bold-italic is omitted on purpose: nothing on the site nests <b> in <i>.
const FACES = ['DejaVuSansMono', 'DejaVuSansMono-Bold', 'DejaVuSansMono-Oblique'];

const IN = 'node_modules/dejavu-fonts-ttf/ttf/';
const OUT = 'src/assets/fonts/';

let text = '';
for (const [first, last] of RANGES) {
  for (let cp = first; cp <= last; cp++) text += String.fromCodePoint(cp);
}

for (const face of FACES) {
  const woff2 = await subsetFont(readFileSync(`${IN}${face}.ttf`), text, {
    targetFormat: 'woff2',
  });
  writeFileSync(`${OUT}${face}.woff2`, woff2);
  console.log(`${face}.woff2  ${(woff2.length / 1024).toFixed(1)} KB`);
}
