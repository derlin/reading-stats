import { useSyncExternalStore } from 'react';
import type { Config, Layout } from 'plotly.js';

// Touch, not screen width: a narrow window on a mouse scrolls fine, a tablet
// does not.
const COARSE = '(pointer: coarse)';

let cached: MediaQueryList | null = null;
const mql = () => (cached ??= window.matchMedia(COARSE));

function subscribe(onChange: () => void): () => void {
  const list = mql();
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

const TOUCH_CONFIG: Partial<Config> = {
  displayModeBar: true, // touch has no hover to reveal it with
  // Box-zoom duplicates +/-, and nothing on this page reads a selection.
  // Pan stays: +/- only ever zooms about the centre, so without it, zooming in
  // strands you in the middle of the range.
  modeBarButtonsToRemove: ['zoom2d', 'select2d', 'lasso2d'],
  displaylogo: false,
};

export interface TouchDrag {
  dragmode: Layout['dragmode'];
  /** For <Plot config>. Undefined on a mouse, which keeps Plotly's defaults. */
  config: Partial<Config> | undefined;
}

/**
 * Touch: drag scrolls the page, zoom moves to the modebar.
 *
 * Plotly preventDefaults touchstart and touchmove for as long as `dragmode` is
 * anything but `false` (dragelement/index.js), so a chart the width of a phone
 * swallows every scroll gesture that starts on it. Tapping Pan re-arms that for
 * that chart until the date range changes.
 */
export function useTouchDrag(): TouchDrag {
  const coarse = useSyncExternalStore(
    subscribe,
    () => mql().matches,
    () => false, // no window during a build-time render; assume a mouse
  );

  return coarse
    ? { dragmode: false, config: TOUCH_CONFIG }
    : { dragmode: 'zoom', config: undefined };
}
