import Plot from 'react-plotly.js';
import { noDataLayout } from './common';

const style = { margin: 'auto', maxWidth: '900px' };
const id = 'plot_weekday';

export default function PlotByWeekday(props) {
  if (props.data.isEmpty()) return <Plot divId={id} style={style} layout={noDataLayout()} />;

  const df = props.data.df_weekdays;

  return (
    <Plot
      divId={id}
      data={[
        {
          type: 'bar',
          x: df.get('weekday'),
          y: df.get('minutes'),
          hovertext: df.get('details'),
          text: df.get('text'),
          marker: { color: '#279658' },
        },
      ]}
      style={style}
      layout={{
        xaxis: { type: 'category' }, // show all dates
        yaxis: { title: 'minutes' },
        autosize: true, // this + useResizeHandler makes it responsive
      }}
      useResizeHandler={false}
    />
  );
}
