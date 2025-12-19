import Plot from 'react-plotly.js';

import { defaultMargins } from './common';
import PlotEmpty from './PlotyEmpty';
import InfoPopover from '../components/InfoPopover';

const style = { maxWidth: '700px' };
const id = 'plot_weekday';

export default function PlotByWeekday({ data }) {
  if (data.isEmpty()) return <PlotEmpty divId={id} style={style} />; // shouldn't happen, but you never know

  const df = data.df_weekdays;
  const captionText = `Discover which days of the week are my busiest for reading.
    This chart breaks down the total reading time by weekday.
    Hover over a bar to see more detailed stats, like the average, minimum, and maximum time spent reading on that day of the week.`;

  return (
    <div className="plot-container" style={{ position: 'relative' }}>
      <InfoPopover text={captionText} />
      <Plot
        divId={id}
        data={[
          {
            type: 'bar',
            x: df.get('weekday'),
            y: df.get('minutes'),
            hovertext: df.get('details'),
            text: df.get('text'),
            marker: { color: '#0eab70' }, // #4bc68b
          },
        ]}
        style={style}
        layout={{
          xaxis: { type: 'category' }, // show all dates
          yaxis: { title: 'minutes' },
          autosize: true, // this + useResizeHandler makes it responsive
          margin: defaultMargins,
          dragmode: false,
        }}
        useResizeHandler={true}
      />
    </div>
  );
}
