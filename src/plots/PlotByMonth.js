import Plot from 'react-plotly.js';

function PlotByMonth(props) {
  const df = props.data.df_months;

  return (
    <Plot
      data={[
        {
          type: 'bar',
          x: df['month'].values,
          y: df['minutes'].values,
          hovertext: df['details'].values,
          text: df['hours'].values,
        },
      ]}
      style={{ width: '100%', height: '100%' }}
      layout={{
        title: 'Reading per month',
        xaxis: { type: 'category' }, // show all dates
        yaxis: { title: 'minutes' },
      }}
      useResizeHandler={true}
    />
  );
}

export default PlotByMonth;
