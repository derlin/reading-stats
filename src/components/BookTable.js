import './BookTable.css';

import * as dfd from 'danfojs';
import { meta } from '../data/Data';

function formatDuration(minutes) {
    const h = Math.ceil(minutes / 60)
    const m = minutes % 60;
    return `${h}:${m < 10 ? '0' + m : m}`
}

function grlink(task, goodreadsId) {
    if(goodreadsId) {
        return <a href={`https://www.goodreads.com/book/show/${goodreadsId}`} target='_blank' rel='noopener'>{task}</a>
    }
    return task
}

export default function BookTable(props) {
  const df = props.data.df_tasks;

  return (
    <table id="book_table">
      <thead>
        <tr>
          <th>book</th>
          <th>duration</th>
          <th>start date</th>
          <th>pages</th>
        </tr>
      </thead>
      <tbody>
        {dfd.toJSON(df).map(row => {
          const m = meta[row['task']] ?? {};
          return (
            <tr key={row['task']}>
              <td>{grlink(row['task'], m?.GoodreadsID)}</td>
              <td>{formatDuration(row['minutes'])}</td>
              <td>{row.day_start}</td>
              <td>{m?.pages ?? '?'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
