import type { Data, Layout } from 'plotly.js';
import Plot from '../../lib/plotly';
import PlotEmpty from './PlotEmpty';
import type { MonthAggregate } from '../../data/useFilteredData';
import { formatDuration } from '../../lib/format';
import { baseLayout, rule, chartColors } from './chartTheme';

const id = 'plot_month';

export default function PlotByMonth({ byMonth }: { byMonth: MonthAggregate[] }) {
  if (byMonth.length === 0) return <PlotEmpty divId={id} />;

  const trace: Data = {
    type: 'bar',
    x: byMonth.map(m => m.month),
    y: byMonth.map(m => m.minutes),
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

  const layout: Partial<Layout> = {
    ...baseLayout(),
    xaxis: { ...rule(), type: 'category' },
    yaxis: { ...rule(), title: { text: 'minutes' }, fixedrange: true },
    margin: { ...baseLayout().margin, b: 80 },
  };

  return (
    <div className="plot-container">
      <Plot divId={id} data={[trace]} layout={layout} style={{}} useResizeHandler={true} />
    </div>
  );
}
