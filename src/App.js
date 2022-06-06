import './App.css';
import * as dfd from "danfojs";
import Plot from 'react-plotly.js';

const books = new dfd.DataFrame(require('./data/all.json'));


const byday1 = books.groupby(['date']).agg({'minutes': 'sum'})

function f(x){
  return new dfd.DataFrame({
    minutes_sum: [x['minutes'].sum()],
    tasks: [x['task'].unique().values.join(", ")],
  });
}

let byday = books.groupby(['date'])
byday = byday.apply(x => f(x))
byday.print()
// assuming that sourceDf has columns ['key', 'col1', 'col2']
/*const groupedDf = books.groupBy('date');

const __groups__ = require('../node_modules/dataframe-js/lib/symbol').__groups__;
const complexAggregateDf = new DataFrame(Object.values(groupedDf[__groups__]).map(({groupKey, group}) => ({
  ...groupKey,
  'minutes_sum': group.stat.sum('minutes'),
  'tasks': group.tasks,
}), [...groupedDf.on, 'minutes_sum', 'tasks']));*/

//books.sql.register('books')
//DataFrame.sql.registerTable(books, 'books')
// Request on Table
//const byday1 = DataFrame.sql.request('SELECT date FROM books GROUP BY date')
//console.log('xx', byday)

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
        layout={{title: 'A Fancy Plot'}}
        useResizeHandler={true}
      />
  );
}

export default App;
