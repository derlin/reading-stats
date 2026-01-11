import * as dfd from 'danfojs';
import { set, format } from 'date-fns';

import allJson from './all.json';
import metaJson from './meta.json';
import allAudio from './audiobooks.json';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const UNKNOWN_PAGE = 0;

// Add some nice prototypes to all dataframes
Object.defineProperties(dfd.NDframe.prototype, {
  // this dirty trick is to avoid the following error when working with empty dataframes:
  //   DtypeError: Dtype "undefined" not supported. dtype must be one of "float32,int32,string,boolean,undefined"
  // If we always use .get('column') in the plots, we should be fine
  // NOTE: do not use lambdas, as "this" becomes undefined (??)
  get: {
    value: function (column) {
      return this.shape[0] === 0 ? [] : this[column].values;
    },
  },
  isEmpty: {
    value: function () {
      return this.shape[0] === 0;
    },
  },
  size: {
    value: function () {
      return this.shape[0];
    },
  },
});

// -----------------------

const books = new dfd.DataFrame(allJson);
const meta = metaJson;

// -- reading per days (minutes and tasks)

const df_byday = books
  .groupby(['date'])
  .apply(row => {
    return new dfd.DataFrame({
      minutes_sum: [row['minutes'].sum()],
      tasks: [row['task'].unique().values.join(', ')],
    });
  })
  .rename({ date_Group: 'date', minutes_sum: 'minutes' })
  .resetIndex();

// -- books read (title, minutes, date start/end)

const df_tasks_paper = books
  .iloc({ rows: books['task_done'] }) // the placeholder task '' is not "done"
  .groupby(['task'])
  .apply(row => {
    const dates = row['date'].values;
    const m = meta[row['task'].values[0]] ?? {};

    return new dfd.DataFrame({
      minutes: [row['minutes'].sum()],
      day_start: [dates.at(0)],
      day_end: [dates.at(-1)],
      days: [
        Math.ceil(
          Math.abs(new Date(dates.at(-1)) - new Date(dates.at(0))) / (24 * 60 * 60 * 1000),
        ) + 1,
      ],
      author: [m.author],
      pages: [m?.pages ?? UNKNOWN_PAGE],
      grId: [m?.GoodreadsID],
    });
  })
  .rename({ task_Group: 'task' })
  .setIndex({ column: 'task' });

// -- monthly statistics

const df_months = books
  .addColumn(
    'month',
    books['date'].apply(x => x.substr(0, 7)),
  )
  .groupby(['month'])
  .apply(row => {
    let minutes = row['minutes'];
    return new dfd.DataFrame({
      minutes: [minutes.sum()],
      hours: ['Σ=' + Math.ceil(minutes.sum() / 60) + 'h'],
      details: [
        `sum: ${minutes.sum()}<br>` +
          `mean: ${minutes.mean().toFixed(2)}<br>` +
          `median: ${minutes.median()}<br>` +
          `min: ${minutes.min()}<br>` +
          `max: ${minutes.max()}`,
      ],
    });
  })
  .rename({ month_Group: 'month' })
  .resetIndex();

// -- weekdays statistics

function df_weekdays(books) {
  // avoid Dtype "undefined" not supported. dtype must be one of "float32,int32,string,boolean,undefined"
  // thrown by column.dt.apply on empty dfs
  // !! IMPORTANT !! callers must use .get() to get columns without errors
  if (books.isEmpty()) return new dfd.DataFrame();

  const df_weekdays = books
    .addColumn(
      'weekday',
      books['date'].dt.dayOfWeek().apply(x => (x + 6) % 7),
    ) // 0 is Sunday
    .groupby(['weekday'])
    .apply(row => {
      let minutes = row['minutes'];
      return new dfd.DataFrame({
        minutes: [minutes.sum()],
        text: [Math.ceil(minutes.mean()) + 'm ± ' + Math.ceil(minutes.std())],
        details: [
          `sum: ${minutes.sum()}<br>` +
            `mean: ${minutes.mean().toFixed(2)}<br>` +
            `median: ${minutes.median()}<br>` +
            `min: ${minutes.min()}<br>` +
            `max: ${minutes.max()}`,
        ],
      });
    })
    .sortValues('weekday_Group')
    .resetIndex();

  // can't find a way to do this inplace...
  const weekdayText = df_weekdays['weekday_Group'].apply(n => WEEKDAYS[n]);
  return df_weekdays.addColumn('weekday', weekdayText);
}

// -- audiobooks
const df_audio = new dfd.DataFrame(allAudio).setIndex({ column: 'title' }).sortValues('day_end');

function prepareAudioForTasks() {
  let audio = df_audio.rename({
    date: 'day_end',
    title: 'task',
    GoodreadsID: 'grId',
  });

  df_tasks_paper.columns
    .filter(col => !audio.columns.includes(col))
    .forEach(col => {
      audio.addColumn(col, Array(audio.shape[0]).fill(null), { inplace: true });
    });
  audio = audio.loc({ columns: df_tasks_paper.columns });
  return audio;
}

const df_tasks = dfd
  .concat({
    dfList: [df_tasks_paper, prepareAudioForTasks()],
    axis: 0,
  })
  .setIndex({ column: 'task' });

console.log('constants loaded');

// ----------------- private utilities

function _filterDataByDate(df, column, from_date, to_date) {
  return _filterDataByDateRange(df, column, column, from_date, to_date);
}

function _filterDataByDateRange(df, start_column, end_column, from_date, to_date) {
  df = df.loc({ rows: df[start_column].apply(x => !x || x <= to_date) });
  df = df.loc({
    // audiobooks don't have start_date, so the end_date needs to be in the range
    rows: df[end_column].apply(x => x >= from_date && x <= to_date),
  });

  return df;
}

// ----------------- exported utilities

export function taskWithMaybeLink(task) {
  const goodreadsId = df_tasks.at(task, 'grId');
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

export function isTaskFinished(task, dateRange) {
  // audiobooks do not have a day_start
  const start = df_tasks.at(task, 'day_start');
  const end = df_tasks.at(task, 'day_end');
  return (!start || start >= dateRange.start_str) && end <= dateRange.end_str;
}

export function isAudiobook(task) {
  return df_audio.index.includes(task);
}

// ----------------- DateRange helper

export class DateRange {
  constructor(start, end) {
    this.start = DateRange.stripTime(start);
    this.end = DateRange.stripTime(end);
    this.start_str = DateRange.dtString(this.start);
    this.end_str = DateRange.dtString(this.end);
  }

  static stripTime(dt) {
    return set(dt, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  }

  static dtString(dt) {
    return format(dt, 'yyyy-MM-dd');
  }
}

// ----------------- Data encapsulation

export class Data {
  constructor(dateRange) {
    this.df_byday = _filterDataByDate(df_byday, 'date', dateRange.start_str, dateRange.end_str);

    this.isEmpty = () => {
      return this.df_byday.isEmpty();
    };

    console.log(df_tasks['The Minders']);
    this.df_tasks_all = _filterDataByDateRange(
      df_tasks,
      'day_start',
      'day_end',
      dateRange.start_str,
      dateRange.end_str,
    );

    this.df_tasks = this.df_tasks_all.loc({
      rows: this.df_tasks_all['day_start'].apply(x => !!x),
    });

    this.df_months = _filterDataByDate(
      df_months,
      'month',
      dateRange.start_str.substr(0, 7),
      dateRange.end_str.substr(0, 7),
    );

    this.df_weekdays = df_weekdays(
      _filterDataByDate(books, 'date', dateRange.start_str, dateRange.end_str),
    );

    this.df_audio = _filterDataByDate(df_audio, 'day_end', dateRange.start_str, dateRange.end_str);
  }
}

export let boundaries = {
  minDate: new Date(books['date'].values.at(0)),
  maxDate: new Date(
    Math.max(new Date(books['date'].values.at(-1)), new Date(df_audio['day_end'].values.at(-1))),
  ),
  years: books['date'].dt.year().unique().values,
};
