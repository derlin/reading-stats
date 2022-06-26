import Plot from 'react-plotly.js';
import { noDataLayout, defaultMargins } from './common';

const style = { margin: 'auto' };
const id = 'plot_month';

export default function PlotByMonth(props) {
  if (props.data.isEmpty()) return <Plot divId={id} style={style} layout={noDataLayout()} />;

  const df = props.data.df_months;

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
      style={style}
      layout={{
        xaxis: { type: 'category' }, // show all dates
        yaxis: { title: 'minutes' },
        autosize: true, // this + useResizeHandler makes it responsive
        margin: defaultMargins,
      }}
      useResizeHandler={true}
    />
  );
}
