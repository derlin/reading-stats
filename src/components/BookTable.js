import styles from './BookTable.module.scss';

import React from 'react';
import * as dfd from 'danfojs';

function formatDuration(minutes) {
  const h = Math.ceil(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m < 10 ? '0' + m : m}`;
}

function grlink(task, goodreadsId) {
  if (goodreadsId) {
    return (
      <a
        href={`https://www.goodreads.com/book/show/${goodreadsId}`}
        target="_blank"
        rel="noreferrer"
      >
        {task}
      </a>
    );
  }
  return task;
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
    if (df.isEmpty()) return '<div>No data</div>';

    if (this.state.sortBy) {
      df = df.sortValues(this.state.sortBy, {
        ascending: this.state.sortAscending,
      });
    }

    const headers = {
      task: 'Book',
      minutes: 'Hours',
      day_start: 'Start Date',
      pages: 'Pages',
    };

    return (
      <table className={styles.bookTable}>
        <thead>
          <tr>
            {Object.keys(headers).map(key => (
              <th key={key} className={this.getHeaderClass(key)} onClick={() => this.sortBy(key)}>
                {headers[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dfd.toJSON(df).map(row => {
            return (
              <tr key={row.task} className={styles.tr}>
                <td className={styles.td}>{grlink(row.task, row.grId)}</td>
                <td className={styles.td}>{formatDuration(row.minutes)}</td>
                <td className={styles.td}>{row.day_start}</td>
                <td className={styles.td}>{row.pages ?? '?'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  getHeaderClass(column) {
    if (this.state.sortBy === column) {
      const arrowClass = this.state.sortAscending ? styles.down : styles.up;
      return [styles.th, styles.sorted, arrowClass].join(' ');
    }
    return styles.th;
  }

  sortBy(column) {
    if (this.state.sortBy === column) {
      this.setState({ sortAscending: !this.state.sortAscending });
    } else {
      this.setState({ sortBy: column, sortAscending: true });
    }
  }
}
