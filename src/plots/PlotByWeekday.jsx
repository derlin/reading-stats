import Plot from 'react-plotly.js';

import { defaultMargins } from './common';
import PlotEmpty from './PlotyEmpty';

const style = { maxWidth: '700px' };
const id = 'plot_weekday';

export default function PlotByWeekday({ data }) {
  if (data.isEmpty()) return <PlotEmpty divId={id} style={style} />; // shouldn't happen, but you never know

  const df = data.df_weekdays;

  return (
    <>
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
      <div className="seo-only">
        <figcaption>
          This chart shows the amount of reading per weekday. On hover, you can see more details,
          such as the min, max and average during this weekday.
        </figcaption>
      </div>
    </>
  );
}
