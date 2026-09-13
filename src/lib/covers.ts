// Sizing for the cover URLs the payload carries.

// Goodreads serves covers from both of these, with the same `._SX240_` sizing
// scheme. Anything else passes through untouched.
const AMAZON_HOSTS = ['m.media-amazon.com', 'i.gr-assets.com'];
const AMAZON_SIZE_SEGMENT = /\._S[XY]\d+_/;

/**
 * Apply a target pixel width to a cover URL, sized for whichever CDN hosts it.
 * Only ever downsizes, so it is safe to apply unconditionally: the stored
 * images are 400px and up, against a tile that asks for 120.
 *
 * Worth doing rather than letting the browser scale: the raw file is ~43kB,
 * `_SX240_` is 22kB and `_SX120_` is 8kB, and the grid renders a few hundred
 * of them at once.
 */
export function sizedCoverUrl(url: string, width: number): string {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return url;
  }

  if (!AMAZON_HOSTS.includes(host)) return url;

  const suffix = `._SX${width}_`;
  return AMAZON_SIZE_SEGMENT.test(url)
    ? url.replace(AMAZON_SIZE_SEGMENT, suffix)
    : url.replace(/\.jpg$/i, `${suffix}.jpg`);
}
