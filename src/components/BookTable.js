import React from 'react';
import * as dfd from 'danfojs';

import { isTaskFinished, taskWithMaybeLink, UNKNOWN_PAGE } from '../data/Data';
import './BookTable.scss';

function formatDuration(minutes) {
  const h = Math.ceil(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m < 10 ? '0' + m : m}`;
}

export default class BookTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: 'day_start',
      sortAscending: true,
    };

    this.sortBy = this.sortBy.bind(this);
  }

  render() {
    let df = this.props.data.df_tasks;
    if (df.isEmpty()) return <p>No book finished in this interval</p>;

    if (this.state.sortBy && df.size() > 1) {
      // NO IDEA why, but danfo-js crashes with IndexError: Specified index (...) not found
      //    at _loc (indexing.js:202:1)
      //    at DataFrame.sortValues (frame.js:1773:1)
      // if we try to sort a dataframe with only one row (gosh, danfo-js is full of bugs)
      df = df.sortValues(this.state.sortBy, {
        ascending: this.state.sortAscending,
      });
    }

    const headers = [
      { name: 'Books', col: 'task' },
      { name: 'Hours', col: 'minutes' },
      { name: 'Start Date', col: 'day_start' },
      { name: 'Days', col: 'days' },
      { name: 'Pages', col: 'pages' },
    ];

    return (
      <div className="bookTable">
        <p className={this.getSortClass('day_start')} onClick={() => this.sortBy('day_start')}>
          ⏰ {/* handle to sort by read date (only on mobile) */}
        </p>
        <table>
          <thead>
            <tr>
              {headers.map(({ name, col, key = col }) => (
                <th key={key} className={this.getSortClass(col)} onClick={() => this.sortBy(col)}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dfd.toJSON(df).map(row => {
              return (
                <tr
                  key={row.task}
                  className={isTaskFinished(row.task, this.props.dateRange) ? '' : 'partial'}
                >
                  <td>{taskWithMaybeLink(row.task, row.grId)}</td>
                  <td className="mono right">{formatDuration(row.minutes)}</td>
                  <td>{row.day_start}</td>
                  <td>{row.days}</td>
                  <td className="mono">{row.pages === UNKNOWN_PAGE ? '?' : row.pages}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  getSortClass(column) {
    let classes = 'sortHandle';
    if (this.state.sortBy === column) {
      classes += ' sorted ' + (this.state.sortAscending ? 'down' : 'up');
    }
    return classes;
  }

  sortBy(column) {
    if (this.state.sortBy === column) {
      this.setState({ sortAscending: !this.state.sortAscending });
    } else {
      this.setState({ sortBy: column, sortAscending: true });
    }
  }
}
