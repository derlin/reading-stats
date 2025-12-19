import Plot from 'react-plotly.js';

import { defaultMargins } from './common';
import PlotEmpty from './PlotyEmpty';
import InfoPopover from '../components/InfoPopover';

const id = 'plot_month';

export default function PlotByMonth({ data }) {
  if (data.isEmpty()) return <PlotEmpty divId={id} />; // shouldn't happen, but you never know

  const df = data.df_months;
  const captionText = `This bar chart provides a monthly overview of my reading time.
    Each bar represents a month's total reading in minutes. Hover over any bar to discover more detailed statistics,
    including the daily average, minimum, and maximum reading times for that month.`;

  return (
    <div className="plot-container" style={{ position: 'relative' }}>
      <InfoPopover text={captionText} />
      <Plot
        divId={id}
        revision={Math.random()}
        data={[
          {
            type: 'bar',
            x: df.get('month'),
            y: df.get('minutes'),
            hovertext: df.get('details'),
            text: df.get('hours'),
            //marker: { color: '#7562e5' }, // #6567ff
          },
        ]}
        style={{}} // remove defaults
        layout={{
          xaxis: { type: 'category' }, // show all dates
          yaxis: { title: 'minutes', fixedrange: true },
          autosize: true, // this + useResizeHandler makes it responsive
          margin: { ...defaultMargins, ...{ b: 80 } }, // the x labels may be vertical
        }}
        useResizeHandler={true}
      />
    </div>
  );
}
