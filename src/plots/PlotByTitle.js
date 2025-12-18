import Plot from 'react-plotly.js';
import * as dfd from 'danfojs';

import { defaultMargins } from './common';
import { isTaskFinished } from '../data/Data';
import PlotEmpty from './PlotyEmpty';

const style = {};
const colors = ['#da492f', '#0eab70', '#2077b4'];
const id = 'plot_title';

function* colorCycler(colors) {
  let index = 0;
  while (true) {
    yield colors[index];
    index = (index + 1) % colors.length;
  }
}

export default function PlotByDay({ data, dateRange }) {
  if (data.isEmpty()) return <PlotEmpty divId={id} style={style} />; // shouldn't happen, but you never know

  console.log(data.df_tasks);
  const df = data.df_tasks;

  const { rows, maxTrack } = createData(df);
  const trackColors = Array.from({ length: maxTrack + 1 }, () => colorCycler(colors));

  return (
    <Plot
      divId={id}
      data={rows.map((task, i) => {
        // Calculate duration in milliseconds or days for the bar width
        const finished = isTaskFinished(task.task, dateRange);

        return {
          type: 'bar',
          orientation: 'h',
          base: [task.start], // The starting point on the x-axis
          x: [task.duration], // The width of the bar
          width: 1, // Adjust thickness of the boxes
          y: [task.track * 1.2],
          text: [task.task.length < 30 ? task.task : task.task.substring(0, 30) + '...'],
          textposition: 'inside',
          insidetextanchor: 'middle',
          insidetextfont: { size: 16 },
          // annotation
          hovertext: task.details,
          hoverinfo: 'text',
          // box color
          marker: {
            color: finished ? trackColors[task.track].next().value : '#EEE',
          },
        };
      })}
      style={style}
      layout={{
        xaxis: {
          type: 'date', // Use 'date' instead of 'category' for timelines
          tickformat: '%Y-%m-%d',
          showgrid: false,
        },
        yaxis: {
          showticklabels: false, // Hides the 0, 1, 2 indices
          fixedrange: true,
        },
        showlegend: false,
        autosize: true,
        margin: defaultMargins,
        height: 300 * (maxTrack + 1),
        barmode: 'overlay', // Critical: stops Plotly from grouping them side-by-side
      }}
      useResizeHandler={true}
    />
  );
}

function createData(df) {
  const trackUsedUntil = [];
  let maxTrack = 0;

  const rows = dfd.toJSON(df).map(row => {
    // find the first track available
    const start = new Date(row.day_start);
    const end = new Date(row.day_end);

    let track = 0;
    while (trackUsedUntil[track] && trackUsedUntil[track] > start) {
      track++;
    }
    trackUsedUntil[track] = end;
    if (track > maxTrack) maxTrack = track;

    return {
      ...row,
      track: track,
      start: start,
      end: end,
      duration: end - start,
      details: `<i>${row.task}</i><br>by ${row.author}<br>read in ${row.days} days (${row.pages} pages)`,
    };
  });

  return { rows, maxTrack };
}
