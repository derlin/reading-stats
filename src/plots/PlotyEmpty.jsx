import Plot from 'react-plotly.js';

const noDataLayout = () => {
  const axisParams = {
    visible: true,
    showticklabels: false,
    showline: false,
    zeroline: false,
  };
  return {
    datarevision: Math.random(), // this is necessary to redraw the whole plot, vs just updating data
    xaxis: axisParams,
    yaxis: axisParams,
    annotations: [
      {
        text: 'No data to display',
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        font: {
          size: 28,
        },
      },
    ],
  };
};

const PlotEmpty = ({ id, style = {} }) => <Plot divId={id} style={style} layout={noDataLayout()} />;

export default PlotEmpty;
