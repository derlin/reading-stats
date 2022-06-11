import Plot from 'react-plotly.js';
import { noDataLayout } from './common';

const style = { margin: 'auto' };
const id = 'plot_month';

function PlotByMonth(props) {
  if (props.data.isEmpty)
    return <Plot divId={id} style={style} layout={noDataLayout()} />;
  const df = props.data.df_months;

  return (
    <Plot
      divId={id}
      revision={Math.random()}
      data={[
        {
          type: 'bar',
          x: df['month'].values,
          y: df['minutes'].values,
          hovertext: df['details'].values,
          text: df['hours'].values,
        },
      ]}
      style={style}
      layout={{
        xaxis: { type: 'category' }, // show all dates
        yaxis: { title: 'minutes' },
        autosize: true, // this + useResizeHandler makes it responsive
      }}
      useResizeHandler={true}
    />
  );
}

export default PlotByMonth;
