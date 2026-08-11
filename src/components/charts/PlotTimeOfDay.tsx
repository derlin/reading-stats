// When Lucy actually reads: weekday × hour of day (D10).
//
// The one thing that makes this chart work is that colour is normalized **per
// weekday row**, not on a shared scale. Weeknights are bedtime-locked, so a
// shared scale would render Monday's evening near-black and flatten Saturday
// — whose reading is genuinely spread across the day — into empty paper. Each
// row is therefore scaled to its own peak, and the chart answers "when, within
// this day, do I read" rather than "which day do I read most". The hover
// carries the absolute minutes so the comparison across rows is still
// available, just not encoded in colour.

import type { Data, Layout } from 'plotly.js';
import Plot from '../../lib/plotly';
import PlotEmpty from './PlotEmpty';
import HeatmapLegend from './HeatmapLegend';
import type { HourWeekday } from '../../data/useFilteredData';
import { formatDuration } from '../../lib/format';
import {
  baseLayout,
  rule,
  sequentialRamp,
  discreteColorscale,
  cellCustomData,
  weekdayChartHeight,
} from './chartTheme';

const id = 'plot_time_of_day';

const MARGIN_TOP = 20;
/** Room for the hour ticks plus the "hour of day" axis title beneath them. */
const MARGIN_BOTTOM = 60;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

export default function PlotTimeOfDay({ byHourWeekday }: { byHourWeekday: HourWeekday }) {
  const { minutes, skipped } = byHourWeekday;
  const total = minutes.flat().reduce((sum, m) => sum + m, 0);
  if (total === 0) return <PlotEmpty divId={id} />;

  // Plotly stacks categorical rows bottom-up, so everything is reversed to put
  // Monday at the top and read like a calendar.
  const rows = [...WEEKDAYS].reverse();
  const rowMinutes = [...minutes].reverse();

  // An hour with no reading is left as a gap rather than given the lightest
  // ramp step: "never" and "rarely" are different answers to this chart's
  // question, and Lucy has whole dead hours (02:00–05:00) worth seeing.
  const z = rowMinutes.map(row => {
    const peak = Math.max(...row);
    return row.map(m => (m === 0 || peak === 0 ? null : m / peak));
  });
  // The duration is pre-formatted, the share left numeric: a hovertemplate
  // can apply a d3 format to a number but cannot call formatDuration.
  const customdata = rowMinutes.map(row => {
    const rowTotal = row.reduce((sum, m) => sum + m, 0);
    return row.map(m => [formatDuration(m), rowTotal === 0 ? 0 : (100 * m) / rowTotal]);
  });

  const trace: Data = {
    type: 'heatmap',
    x: HOURS,
    y: rows,
    z,
    customdata: cellCustomData(customdata),
    xgap: 2,
    ygap: 2,
    showscale: false,
    zmin: 0,
    zmax: 1,
    colorscale: discreteColorscale(sequentialRamp),
    hoverongaps: false,
    hovertemplate:
      '<b>%{y}, %{x}:00</b><br>' +
      '%{customdata[0]} total<br>' +
      "%{customdata[1]:.0f}% of that weekday's reading" +
      '<extra></extra>',
  };

  const layout: Partial<Layout> = {
    ...baseLayout(),
    // Zoom is off: at 24×7 there is nothing to zoom into, and drag-to-zoom on
    // a grid this coarse is only ever an accident.
    xaxis: { ...rule(), type: 'category', title: { text: 'hour of day' }, fixedrange: true },
    yaxis: { ...rule(), type: 'category', fixedrange: true },
    margin: { ...baseLayout().margin, l: 100, t: MARGIN_TOP, b: MARGIN_BOTTOM },
    // Sized by row rather than left at Plotly's default 450, which gave this
    // chart roughly twice the row height of the calendar directly below it.
    height: weekdayChartHeight(MARGIN_TOP, MARGIN_BOTTOM),
  };

  return (
    <div className="plot-container">
      <Plot
        divId={id}
        data={[trace]}
        layout={layout}
        style={{ width: '100%' }}
        useResizeHandler={true}
      />
      <HeatmapLegend
        items={sequentialRamp.map(color => ({ color }))}
        before="quiet hour"
        after="that weekday's peak"
      />
      {skipped > 0 && (
        <p className="plot-detail">
          {skipped} session{skipped === 1 ? '' : 's'} omitted: Boosted recorded no clock time. Their
          minutes still count in every other chart.
        </p>
      )}
    </div>
  );
}
