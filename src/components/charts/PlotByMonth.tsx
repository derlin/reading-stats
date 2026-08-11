import type { Data, Layout } from 'plotly.js';
import Plot from '../../lib/plotly';
import PlotEmpty from './PlotEmpty';
import type { MonthAggregate } from '../../data/useFilteredData';
import { formatDuration } from '../../lib/format';
import { baseLayout, rule, chartColors } from './chartTheme';

const id = 'plot_month';

const MINUTES_PER_HOUR = 60;

/**
 * Nice whole-hour tick steps. The axis is in hours rather than minutes because
 * four-digit minute labels ("4000") pushed the axis title into the ticks; hours
 * are at most two digits over any realistic range. The step is picked here
 * rather than left to Plotly's autoticks, which would happily label a short
 * range in half-hours.
 */
const HOUR_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

function hourTickStep(maxHours: number): number {
  return HOUR_STEPS.find(step => maxHours / step <= 8) ?? HOUR_STEPS[HOUR_STEPS.length - 1];
}

export default function PlotByMonth({ byMonth }: { byMonth: MonthAggregate[] }) {
  if (byMonth.length === 0) return <PlotEmpty divId={id} />;

  const trace: Data = {
    type: 'bar',
    x: byMonth.map(m => m.month),
    // Hours, matching the axis; the bar label still spells out hours+minutes.
    y: byMonth.map(m => m.minutes / MINUTES_PER_HOUR),
    text: byMonth.map(m => formatDuration(m.minutes)),
    textposition: 'outside',
    marker: { color: chartColors.accent },
    // Durations are pre-formatted here because a hovertemplate can only
    // interpolate values and apply d3 number formats — it cannot call
    // formatDuration. Every minutes-bearing hover on the site does this.
    customdata: byMonth.map(m => [
      formatDuration(m.minutes),
      formatDuration(m.stats.mean),
      formatDuration(m.stats.min),
      formatDuration(m.stats.max),
    ]),
    hovertemplate:
      '<b>%{x}</b><br>' +
      'total: %{customdata[0]}<br>' +
      'daily avg: %{customdata[1]}<br>' +
      'daily min/max: %{customdata[2]} / %{customdata[3]}' +
      '<extra></extra>',
  };

  const maxHours = Math.max(...byMonth.map(m => m.minutes)) / MINUTES_PER_HOUR;

  const layout: Partial<Layout> = {
    ...baseLayout(),
    xaxis: { ...rule(), type: 'category' },
    yaxis: {
      ...rule(),
      title: { text: 'hours' },
      fixedrange: true,
      dtick: hourTickStep(maxHours),
      // Grows the left margin to fit ticks *and* title, instead of trusting the
      // fixed margin to be wide enough for whatever the range produces.
      automargin: true,
    },
    margin: { ...baseLayout().margin, b: 80 },
  };

  return (
    <div className="plot-container plot-container--interactive">
      <Plot divId={id} data={[trace]} layout={layout} style={{}} useResizeHandler={true} />
    </div>
  );
}
