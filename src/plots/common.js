export function noDataLayout() {
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
        text: 'No matching data found',
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        font: {
          size: 28,
        },
      },
    ],
  };
}
