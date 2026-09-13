// The rating scale: how a 0-5 rating becomes a bar under a cover, and which
// ratings the grid's filter offers. Both the bar's length and its colour are
// driven from `domainPosition`, so the two can never disagree.

import { sequentialRamp } from '../components/charts/chartTheme';

// The domain starts at 2 rather than 0 because that is where the library
// actually lives: almost everything Lucy finishes lands between 2 and 5, and
// stretching the bar over the full range would squeeze all of them into its
// top half to give the handful below 2 room they don't need.
const DOMAIN_MIN = 2;
export const DOMAIN_MAX = 5;

// A rating at or below the domain floor still has to read as a bar rather
// than as an empty track, which means something. See `ratingBarFraction`.
const BAR_MIN_FRACTION = 0.08;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Clamped, so a 0.5 sits at the same place as a 2. */
function domainPosition(rating: number): number {
  return (clamp(rating, DOMAIN_MIN, DOMAIN_MAX) - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN);
}

/**
 * 0 to 1, for the width of the bar under a tile. Length carries what a
 * five-step ramp cannot: a 3.2 and a 3.8 land on the same colour but a fifth
 * of the tile apart.
 *
 * 0 is the one rating that escapes the clamp and renders as a genuinely empty
 * track. It is a real rating here, not a missing one, and the only place on
 * the scale where "I finished this and hated it" is worth telling apart from
 * the 1.x books that clamp to the floor.
 */
export function ratingBarFraction(rating: number): number {
  return rating === 0 ? 0 : Math.max(BAR_MIN_FRACTION, domainPosition(rating));
}

/**
 * The heatmaps' ramp starts one step lower than this one. Its lightest step is
 * meant to sit on bare paper, where it reads as "almost nothing"; here it sits
 * on the bar's own track, and a short bar in it was indistinguishable from the
 * empty track behind it — which would have cost a rating of 0 the one thing
 * the empty track is there to say.
 */
const BAR_RAMP = sequentialRamp.slice(1);

/** Quiet at the bottom of the domain, full accent at the top. */
export function ratingColor(rating: number): string {
  const step = Math.floor(domainPosition(rating) * BAR_RAMP.length);
  return BAR_RAMP[Math.min(BAR_RAMP.length - 1, step)];
}

/** The top of the domain, which the grid stars rather than only colouring. */
export function isPerfectRating(rating: number | null): boolean {
  return rating !== null && rating >= DOMAIN_MAX;
}

export interface RatingFilter {
  label: string;
  /** Null keeps every book, including the unrated. */
  min: number | null;
}

/**
 * Thresholds rather than bands, because that is how the scale gets used: most
 * of the library is a 3 or better, and the question being asked of the grid is
 * "show me the good ones", not "show me the 2s". `4.5+` earns its place in
 * between because `4+` still returns hundreds of books.
 */
export const RATING_FILTERS: RatingFilter[] = [
  { label: 'All', min: null },
  { label: '3+', min: 3 },
  { label: '4+', min: 4 },
  { label: '4.5+', min: 4.5 },
  { label: '5', min: DOMAIN_MAX },
];
