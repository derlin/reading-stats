import * as dfd from 'danfojs';
import React from 'react';
import Plot from 'react-plotly.js';
import { noDataLayout, defaultMargins } from './common';
import { taskWithMaybeLink } from '../data/Data';
import { format, formatDuration, intervalToDuration } from 'date-fns';

const colors = ['LightSalmon', 'beige'];
const id = 'plot_day';

export default class PlotByDay extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: null, showAnnot: true };
    this.onPointClicked = this.onPointClicked.bind(this);
    this.toggleAnnot = this.toggleAnnot.bind(this);
  }

  render() {
    if (this.props.data.isEmpty()) return <Plot divId={id} layout={noDataLayout()} />;

    const df_tasks = this.props.data.df_tasks;
    const df_byday = this.props.data.df_byday;

    const [shapes, annotations] = this.state.showAnnot
      ? this.computeAnnotations(df_tasks)
      : [[], []];

    return (
      <div>
        <p id="byday_details">
          {this.state.text ?? (
            <>
              <i>Click a point to see details</i>
            </>
          )}
        </p>
        <span onClick={this.toggleAnnot} className={'plot-btn'}>
          {this.state.showAnnot ? 'hide annotations' : 'show annotations'}
        </span>
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
            xaxis: { rangeslider: { visible: false } },
            yaxis: { title: 'minutes' },
            margin: { ...defaultMargins, t: 50 },
          }}
          onClick={this.onPointClicked}
          useResizeHandler={true}
        />
      </div>
    );
  }

  computeAnnotations(df_tasks) {
    let current_color = true;
    let shapes = [];
    let annotations = [];

    dfd.toJSON(df_tasks).forEach(row => {
      const task = row['task'];
      current_color = !current_color;
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: row['day_start'],
        x1: row['day_end'],
        y0: 0,
        y1: 1,
        fillcolor: colors[+current_color],
        opacity: 0.2,
        line: {
          width: 0,
        },
      });

      annotations.push({
        text: task.length < 30 ? task : task.substring(0, 30) + '...',
        textangle: -90,
        x: row['day_start'],
        xanchor: 'left',
        // with ref=paper, y=0 mean bottom, y=1 means top of the plot
        y: 1,
        yref: 'paper',
        yanchor: 'top',
        showarrow: false,
      });
    });

    return [shapes, annotations];
  }

  toggleAnnot() {
    this.setState({ showAnnot: !this.state.showAnnot });
  }

  onPointClicked(e) {
    const point = e.points[0];

    const date = format(new Date(point.x), 'PPP (EEEE)');
    const duration = formatDuration(intervalToDuration({ start: 0, end: point.y * 60 * 1000 }));
    const tasks = point.text.split(', ').map((task, index) => (
      <>
        {index ? ', ' : ''}
        {taskWithMaybeLink(task)}
      </>
    ));

    const text = (
      <>
        On {date}, I read {duration} of {tasks}
      </>
    );
    this.setState({ text: text });
  }
}
