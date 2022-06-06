import './App.css';
import * as dfd from "danfojs";
import Plot from 'react-plotly.js';

const books = new dfd.DataFrame(require('./data/all.json'));

function f(x){
  return new dfd.DataFrame({
    minutes_sum: [x['minutes'].sum()],
    tasks: [x['task'].unique().values.join(", ")],
  });
}
let byday = books.groupby(['date'])
byday = byday.apply(x => f(x))
//byday.print()

function u(x){
  let dates = x['date'].values
  let date0 = dates[0], date1 = dates[dates.length - 1]

  return new dfd.DataFrame({
    minutes: [x['minutes'].sum()],
    day_start: [date0],
    day_end: [date1],
    days: [Math.ceil(Math.abs(new Date(date1) - new Date(date0)) / (24*60*60*1000))],
  });
}
let tasks_and_days = books.iloc({ rows: books['task_done'] }).groupby(['task']).apply(x => u(x), {inplace: true})
tasks_and_days.print()
//df['date'].sortValues({ascending: false}).print()


// let books_read = df.groupby(['task']).agg({
//   date: ['min', 'max'],
//   minutes: 'sum'
// }).sort_values('date_start')
// books_read.print()

const colors=['LightSalmon', 'beige']
let c=true

let shapes = [], annotations = []
dfd.toJSON(tasks_and_days).forEach(x => {
  c=!c
  shapes.push({
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: x['day_start'],
    y0: 0,
    x1: x['day_end'],
    y1: 1,
    fillcolor: colors[+c],
    opacity: 0.2,
    line: {
      width: 0
    }
  })
  const task = x['task_Group']
  annotations.push({
    text: task.length < 30 ? task : (task.substring(0, 30) + '...'),
    textangle: -90,
    x: x['day_start'],
    xanchor: 'left',
    //y: 400,
    // with ref=paper, y=0 mean bottom, y=1 means top of the plot
    y: 1,
    yref: 'paper',
    yanchor: 'top',
    showarrow: false,
  })
})

function App() {
  return (
    <Plot
        data={[
          {
            x: byday['date_Group'].values,
            y: byday['minutes_sum'].values,
            type: 'line',
            mode: 'lines',
            text: byday['tasks'].values,
          }
        ]}
        style={{width: '100%', height: '100%'}}
        layout={{title: 'A Fancy Plot', shapes: shapes, annotations: annotations}}
        useResizeHandler={true}
      />
  );
}

export default App;
