import * as dfd from 'danfojs';
import React from 'react';
import Plot from 'react-plotly.js';
import { noDataLayout, defaultMargins } from './common';

const colors = ['LightSalmon', 'beige'];
const id = 'plot_day';

export default class PlotByDay extends React.Component {
  constructor(props) {
    super(props);
    this.onPointClicked = this.onPointClicked.bind(this);
  }

  render() {
    if (this.props.data.isEmpty()) return <Plot divId={id} layout={noDataLayout()} />;

    let current_color = true;
    const shapes = [];
    const annotations = [];

    const df_tasks = this.props.data.df_tasks;
    const df_byday = this.props.data.df_byday;

    dfd.toJSON(df_tasks).forEach(x => {
      current_color = !current_color;
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: x['day_start'],
        y0: 0,
        x1: x['day_end'],
        y1: 1,
        fillcolor: colors[+current_color],
        opacity: 0.2,
        line: {
          width: 0,
        },
      });

      const task = x['task'];
      annotations.push({
        text: task.length < 30 ? task : task.substring(0, 30) + '...',
        textangle: -90,
        x: x['day_start'],
        xanchor: 'left',
        //y: 400,
        // with ref=paper, y=0 mean bottom, y=1 means top of the plot
        y: 1,
        yref: 'paper',
        yanchor: 'top',
        showarrow: false,
      });
    });

    return (
      <Plot
        divId={id}
        data={[
          {
            x: df_byday.get('date'),
            y: df_byday.get('minutes'),
            type: 'line',
            mode: 'lines',
            text: df_byday.get('tasks'),
            line: { color: '#da492f' },
          },
        ]}
        style={{ width: '100%', height: '700px' }}
        layout={{
          shapes: shapes,
          annotations: annotations,
          xaxis: { rangeslider: { visible: true } },
          yaxis: { title: 'minutes' },
          margin: {...defaultMargins, t: 50},
        }}
        onClick={this.onPointClicked}
        useResizeHandler={true}
      />
    );
  }

  onPointClicked(e) {
    console.log(e.points[0].text);
  }
}
