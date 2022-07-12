import React from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js/dist/plotly';
import { renderToString } from 'react-dom/server';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import * as dfd from 'danfojs';

import { defaultMargins } from './common';
import { taskWithMaybeLink, isTaskFinished } from '../data/Data';
import PlotEmpty from './PlotyEmpty';

const colors = ['#ffebe2', '#fdfdf7']; // LightSalmon at 0.2 opacity, beige at 0.2 opacity
const unfinishedColor = '#FFFFFFAA'; // should not be full opaque, as it is drawn above the trace
const id = 'plot_day';

const defaultDetailsText = `<i>Click a point to see details</i>`;

export default class PlotByDay extends React.Component {
  constructor(props) {
    super(props);

    // show info on click
    this.detailsRef = null; // reference to the details div
    this.setDetailsText = this.setDetailsText.bind(this);
    this.onPointClicked = this.onPointClicked.bind(this);

    // toggle plot annotations and shapes
    this.fakeState = { shapes: [], annotations: [], visible: false };
    this.toggleAnnotBtnRef = null;
    this.toggleAnnot = this.toggleAnnot.bind(this);
    this.updateToggleAnnotBtnText = this.updateToggleAnnotBtnText.bind(this);
  }

  render() {
    const df_tasks = this.props.data.df_tasks;
    const df_byday = this.props.data.df_byday;
    const dr = this.props.dateRange;

    if (df_byday.size() < 2) return <PlotEmpty id={id} />;

    const [shapes, annotations] = this.computeAnnotations(df_tasks, dr);

    this.fakeState = { shapes, annotations, visible: true };

    return (
      <div>
        <p
          id="byday_details"
          ref={elt => {
            this.detailsRef = elt;
            this.setDetailsText(); // reset to default (setting default here doesn't work on re-render)
          }}
        ></p>
        <span
          onClick={this.toggleAnnot}
          className={'plot-btn'}
          ref={elt => {
            this.toggleAnnotBtnRef = elt;
            this.updateToggleAnnotBtnText();
          }}
        >
          Toggle Annotations
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
          style={{ width: '100%' }}
          layout={{
            shapes: shapes,
            annotations: annotations,
            xaxis: { rangeslider: { visible: false } },
            yaxis: { title: 'minutes', fixedrange: true },
            margin: { ...defaultMargins, t: 50 },
          }}
          onClick={this.onPointClicked}
          useResizeHandler={true}
        />
      </div>
    );
  }

  computeAnnotations(df_tasks, dateRange) {
    let current_color = true;
    let shapes = [];
    let annotations = [];

    dfd.toJSON(df_tasks).forEach(row => {
      const task = row['task'];
      // to avoid having shapes bigger than the points displayed
      const dayStart = [row['day_start'], dateRange.start_str].sort()[1];
      const dayEnd = [row['day_end'], dateRange.end_str].sort()[0];
      const finished = isTaskFinished(task, dateRange);

      current_color = !current_color;
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: dayStart,
        x1: dayEnd,
        y0: 0,
        y1: 1,
        fillcolor: finished ? colors[+current_color] : unfinishedColor,
        layer: finished ? 'below' : 'above',
        line: {
          width: 0,
        },
      });

      annotations.push({
        text: task.length < 30 ? task : task.substring(0, 30) + '...',
        textangle: -90,
        x: dayStart,
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
    const { shapes, annotations, visible } = this.fakeState;
    // use plotly directly to avoid triggering a re-render (and thus lose zoom/pan etc.)
    // note that this can be done using updatebuttons, but their style is meh
    Plotly.relayout(id, { shapes: visible ? [] : shapes, annotations: visible ? [] : annotations });
    this.fakeState.visible = !visible;
    this.updateToggleAnnotBtnText();
  }

  updateToggleAnnotBtnText() {
    if (this.toggleAnnotBtnRef)
      this.toggleAnnotBtnRef.innerHTML = this.fakeState.visible
        ? 'Hide Annotations'
        : 'Show Annotations';
  }

  onPointClicked(e) {
    const point = e.points[0];
    console.log('point clicked', point);

    const date = format(new Date(point.x), 'PPP (EEEE)');
    const duration = formatDuration(intervalToDuration({ start: 0, end: point.y * 60 * 1000 }));
    const tasks = point.text
      .split(', ')
      .map(task => renderToString(taskWithMaybeLink(task)))
      .join(', ');

    const text = `On ${date}, I read ${duration} of ${tasks}`;
    this.setDetailsText(text);
  }

  setDetailsText(text) {
    // do NOT use a state here, since if we call render again,
    // the plot state will be lost (zoom, etc will be reset)
    if (this.detailsRef) this.detailsRef.innerHTML = text ?? defaultDetailsText;
  }
}
