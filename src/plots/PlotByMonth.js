import Plot from 'react-plotly.js';

import { defaultMargins } from './common';
import PlotEmpty from './PlotyEmpty';

const id = 'plot_month';

export default function PlotByMonth({ data }) {
  if (data.isEmpty()) return <PlotEmpty divId={id} />; // shouldn't happen, but you never know

  const df = data.df_months;

  return (
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
        margin: defaultMargins,
      }}
      useResizeHandler={true}
    />
  );
}
