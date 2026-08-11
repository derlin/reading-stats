// Reading intensity per calendar day, GitHub-contribution style (D10, kept as
// a trial). Weekday rows, week columns, filtered by the same global range as
// every other chart.
//
// Layout call (Lucy, 2026-08-09): the strip always fits the content width, so
// at the "All" preset its 325 week columns are ~3px each. That is deliberate —
// the full range is meant to read as texture, and Plotly's drag-to-zoom is the
// way in to any particular stretch of it. Hence x is a real date axis rather
// than week indices: month and year ticks then re-space themselves as you
// zoom, which week indices could never do.
//
// Colour here is a **shared** scale, unlike the time-of-day heatmap — the
// whole point is comparing one day against another across the range — with
// hard buckets rather than a continuous blend, so a cell can be read off the
// legend rather than guessed at.

import { useMemo } from 'react';
import type { Data, Layout, PlotData } from 'plotly.js';
import Plot from '../../lib/plotly';
import PlotEmpty from './PlotEmpty';
import HeatmapLegend from './HeatmapLegend';
import { formatDateOnly, type DateRange, type DayAggregate } from '../../data/useFilteredData';
import { formatDuration } from '../../lib/format';
import {
  baseLayout,
  rule,
  sequentialRamp,
  zeroColor,
  discreteColorscale,
  cellCustomData,
  weekdayChartHeight,
} from './chartTheme';

const id = 'plot_calendar';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MARGIN_TOP = 20;
/** Room for the month/year ticks; no axis title, so tighter than the chart above. */
const MARGIN_BOTTOM = 40;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Upper bound of each bucket, in minutes; the last bucket is open-ended. Fixed
 * thresholds rather than quantiles of the selection, so a colour means the
 * same thing no matter what the date range is set to — and they land on
 * readable clock amounts. Against the real data they split the 2244 reading
 * days 148 / 269 / 580 / 622 / 625, which uses the whole ramp.
 */
const BUCKETS = [15, 30, 60, 90];

const BUCKET_LABELS = ['missed', '<15', '15–29', '30–59', '60–89', '90+'];

/** 0 for a day with no reading, then 1–5 across the ramp. */
function bucketOf(minutes: number): number {
  if (minutes === 0) return 0;
  const index = BUCKETS.findIndex(upper => minutes < upper);
  return index === -1 ? BUCKETS.length + 1 : index + 1;
}

interface Grid {
  /** Centre of the first week column, as epoch ms. */
  firstWeek: number;
  /** Left edge of the first column and right edge of the last, as epoch ms — the x axis range. */
  bounds: [number, number];
  /** `z[weekday][week]`, bucket index, or null for a padding day outside the range. */
  z: (number | null)[][];
  /** Per cell, `[minutes, ISO date]` for the hover; null where z is null. */
  cells: ([number, string] | null)[][];
}

/**
 * Lays the range out as a grid of Monday-aligned week columns.
 *
 * This is chart geometry rather than aggregation, which is why it lives here
 * and not in `useFilteredData`: it exists only because the calendar draws
 * weeks as columns.
 *
 * Every day between the range's bounds gets a cell, not just days that have
 * sessions — a missed day is the thing worth seeing here. `useDateRange`
 * clamps the range to the data's own extent, so a zero inside the grid is
 * always a real miss and never "no data yet"; only the padding days at either
 * end of the first and last week are null.
 */
function buildGrid(byDay: DayAggregate[], range: DateRange): Grid {
  const minutesByDate = new Map(byDay.map(d => [formatDateOnly(d.date), d.minutes]));

  const firstMonday = new Date(range.start);
  firstMonday.setUTCDate(firstMonday.getUTCDate() - ((range.start.getUTCDay() + 6) % 7));

  const z: (number | null)[][] = WEEKDAYS.map(() => []);
  const cells: ([number, string] | null)[][] = WEEKDAYS.map(() => []);
  let lastMonday = firstMonday;

  for (let cursor = firstMonday; cursor <= range.end; cursor = new Date(+cursor + 7 * MS_PER_DAY)) {
    lastMonday = cursor;
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = new Date(+cursor + weekday * MS_PER_DAY);
      if (day < range.start || day > range.end) {
        z[weekday].push(null);
        cells[weekday].push(null);
        continue;
      }
      const iso = formatDateOnly(day);
      const minutes = minutesByDate.get(iso) ?? 0;
      z[weekday].push(bucketOf(minutes));
      cells[weekday].push([minutes, iso]);
    }
  }

  return {
    // Plotly centres a heatmap cell on its x value, so a column is placed at
    // its week's midpoint rather than its Monday — otherwise every cell would
    // sit half a week to the right of the month tick it belongs to.
    firstWeek: +firstMonday + 3.5 * MS_PER_DAY,
    bounds: [+firstMonday, +lastMonday + 7 * MS_PER_DAY],
    z,
    cells,
  };
}

export default function PlotCalendar({
  byDay,
  range,
}: {
  byDay: DayAggregate[];
  range: DateRange;
}) {
  const grid = useMemo(() => buildGrid(byDay, range), [byDay, range]);

  if (byDay.length === 0) return <PlotEmpty divId={id} />;

  // Reversed so Monday sits at the top: Plotly stacks categorical rows bottom-up.
  const rows = [...WEEKDAYS].reverse();
  const z = [...grid.z].reverse();
  // Formatted here rather than in the grid, which stays pure geometry; a
  // hovertemplate can't call formatDuration, so the string has to be shipped
  // per cell. Padding cells are never hovered (`hoverongaps: false`).
  const customdata = [...grid.cells]
    .reverse()
    .map(row => row.map(cell => (cell ? [formatDuration(cell[0]), cell[1]] : ['', ''])));

  // `x0`/`dx` are Plotly's evenly-spaced-coordinate attributes, supported on
  // every cartesian trace but declared only on shapes in `@types/plotly.js`.
  // Widening the trace type keeps every other property checked normally.
  const trace: Partial<PlotData> & { x0: string; dx: number } = {
    type: 'heatmap',
    // The column width is stated rather than left to Plotly, which otherwise
    // infers it from the gap between x values — and has no gap to measure when
    // the range is a single week, at which point it stretches the one column
    // across the whole plot and ticks the axis in fractions of a millisecond.
    x0: new Date(grid.firstWeek).toISOString(),
    dx: 7 * MS_PER_DAY,
    y: rows,
    z,
    customdata: cellCustomData(customdata),
    xgap: 1,
    ygap: 1,
    showscale: false,
    // Half-steps either side so each integer bucket lands in the middle of its
    // colour band rather than on a boundary.
    zmin: -0.5,
    zmax: BUCKETS.length + 1.5,
    colorscale: discreteColorscale([zeroColor, ...sequentialRamp]),
    hoverongaps: false,
    hovertemplate: '<b>%{customdata[1]}</b><br>%{customdata[0]}<extra></extra>',
  };

  const layout: Partial<Layout> = {
    ...baseLayout(),
    // x stays zoomable — it is the only way to read a multi-year range at this
    // cell size. y is fixed at 7 rows, which also confines box-zoom to the
    // horizontal, where it is actually wanted.
    xaxis: {
      ...rule(),
      type: 'date',
      fixedrange: false,
      // Pinned to the weeks actually drawn, so a short range doesn't leave the
      // strip floating in empty axis.
      range: [new Date(grid.bounds[0]).toISOString(), new Date(grid.bounds[1]).toISOString()],
    },
    yaxis: { ...rule(), type: 'category', fixedrange: true },
    margin: { ...baseLayout().margin, l: 60, t: MARGIN_TOP, b: MARGIN_BOTTOM },
    // Same row height as the time-of-day heatmap above, from the same helper,
    // so the two charts' weekday rows stay in step if either is retuned.
    height: weekdayChartHeight(MARGIN_TOP, MARGIN_BOTTOM),
    dragmode: 'zoom',
  };

  return (
    <div className="plot-container plot-container--interactive">
      <Plot
        divId={id}
        data={[trace as Data]}
        layout={layout}
        style={{ width: '100%' }}
        useResizeHandler={true}
      />
      <HeatmapLegend
        items={[zeroColor, ...sequentialRamp].map((color, i) => ({
          color,
          label: BUCKET_LABELS[i],
        }))}
        after="min / day"
      />
    </div>
  );
}
