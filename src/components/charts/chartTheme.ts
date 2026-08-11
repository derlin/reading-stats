import type { Layout, Font, PlotData } from 'plotly.js';

// Mirrors src/styles/_tokens.scss (D11/B3). Plotly layouts are plain JS
// objects, not CSS, so the palette can't be @use'd from Sass — keep these
// values in sync with _tokens.scss by hand.
export const chartColors = {
  paper: '#fdfdf7',
  ink: '#000',
  accentLight: '#ffebe2',
  accent: '#e91e63',
  secondary: '#1f77b4',
  // Blend of accent/accentLight, for a third salmon-range track shade — not
  // in _tokens.scss since it exists only for the Gantt's track cycling.
  accentMid: '#f484a2',
  // Out-of-range dimming for partial bars (BookAggregate.partial): a neutral
  // ink tint rather than a fourth palette color, so "extends past the
  // visible range" reads as a state, not another track.
  dim: '#00000026',
} as const;

/**
 * Sequential ramp for the two heatmaps (B5), five steps interpolated in OKLCH
 * between the two ends of the accent range D11 names — `accentLight` →
 * `accent`. Derived from the palette rather than invented, so the heatmaps
 * read as the same site as the Gantt and the per-month bars.
 *
 * What makes it legible as magnitude is that lightness falls monotonically in
 * even steps (OKLab L 0.954 → 0.864 → 0.779 → 0.693 → 0.606); hue and chroma
 * just ride along. Re-derive rather than hand-editing a step if this ever
 * changes.
 */
export const sequentialRamp = ['#ffebe2', '#ffc2b0', '#fe968a', '#f76570', '#e91e63'] as const;

/**
 * A day inside the range with no reading at all. A neutral ink tint rather
 * than a sixth ramp step, because absence is a different kind of thing from a
 * small amount — and since Lucy misses only a handful of days a year, those
 * holes are the signal, not the noise.
 */
export const zeroColor = '#00000014';

/**
 * Builds a Plotly colorscale with hard steps instead of a continuous blend —
 * D11's "flat fills, no gradients" applied to a heatmap. Each color is
 * repeated at both ends of its band so there is nowhere left to interpolate.
 */
export function discreteColorscale(colors: readonly string[]): [number, string][] {
  return colors.flatMap((color, i): [number, string][] => [
    [i / colors.length, color],
    [(i + 1) / colors.length, color],
  ]);
}

/**
 * `@types/plotly.js` models `customdata` as at most two-dimensional, but a
 * heatmap's is three: one array of values *per cell*, which `%{customdata[0]}`
 * indexes in a hovertemplate at runtime. Plotly itself handles this fine — the
 * cast covers a gap in the type definitions, not a real constraint, which is
 * why it is confined to this one named helper.
 */
export function cellCustomData(cells: (string | number)[][][]): PlotData['customdata'] {
  return cells as unknown as PlotData['customdata'];
}

// Must match `$mono-font-family` in styles/_tokens.scss — Plotly takes its
// font as a string from TS, so the stack is stated twice by necessity.
export const chartFontFamily = '"DejaVu Sans Mono", Menlo, Consolas, "Courier New", monospace';

export const defaultMargins = { t: 30, l: 50, b: 50, r: 50 };

/**
 * Height of a single weekday row, shared by the two heatmaps that have one.
 * They sit next to each other on the page, so drawing their rows at different
 * heights would make them read as unrelated charts rather than as two views of
 * the same seven days.
 */
export const weekdayRowHeight = 28;

/** Total plot height for a seven-row weekday heatmap, given its vertical margins. */
export function weekdayChartHeight(top: number, bottom: number): number {
  return 7 * weekdayRowHeight + top + bottom;
}

const baseFont: Partial<Font> = {
  family: chartFontFamily,
  color: chartColors.ink,
  size: 13,
};

/** Shared layout base: paper background, ink text, ink hover boxes. Spread first, then override per-chart. */
export function baseLayout(): Partial<Layout> {
  return {
    paper_bgcolor: chartColors.paper,
    plot_bgcolor: chartColors.paper,
    font: baseFont,
    margin: defaultMargins,
    hoverlabel: {
      bgcolor: chartColors.paper,
      bordercolor: chartColors.ink,
      font: baseFont,
    },
  };
}

/** Ruled axis, no gridlines (D11: "flat fills, ruled axes, no gradients"). */
export function rule() {
  return {
    showgrid: false,
    zeroline: false,
    showline: true,
    linecolor: chartColors.ink,
    linewidth: 2,
  };
}

export function noDataLayout(): Partial<Layout> {
  const axis = { visible: true, showticklabels: false, showline: false, zeroline: false };
  return {
    ...baseLayout(),
    datarevision: Math.random(), // forces a full redraw, vs just a data update
    xaxis: axis,
    yaxis: axis,
    annotations: [
      {
        text: 'No matching data found',
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        font: { ...baseFont, size: 28 },
      },
    ],
  };
}
