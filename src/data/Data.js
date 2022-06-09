import * as dfd from 'danfojs';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const books = new dfd.DataFrame(require('./all.json'));

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

const df_tasks = books
  .iloc({ rows: books['task_done'] })
  .groupby(['task'])
  .apply(row => {
    let dates = row['date'].values;

    return new dfd.DataFrame({
      minutes: [row['minutes'].sum()],
      day_start: [dates.at(0)],
      day_end: [dates.at(-1)],
      days: [
        Math.ceil(
          Math.abs(new Date(dates.at(-1)) - new Date(dates.at(0))) /
            (24 * 60 * 60 * 1000)
        ),
      ],
    });
  })
  .rename({ task_Group: 'task' })
  .resetIndex();

const df_months = books
  .addColumn(
    'month',
    books['date'].apply(x => x.substr(0, 7))
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

function df_weekdays(books) {
  return books
    .addColumn(
      'weekday',
      books['date'].dt.dayOfWeek().apply(n => WEEKDAYS[n])
    )
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
    .rename({ weekday_Group: 'weekday' })
    .resetIndex();
}

console.log('constants loaded');

function _filterDataByDate(df, column, from_date, to_date) {
  if (from_date)
    df = df.iloc({ rows: df[column].apply(x => x >= from_date) }).resetIndex();
  if (to_date)
    df = df.iloc({ rows: df[column].apply(x => x < to_date) }).resetIndex();
  return df;
}

function dateToString(date) {
  if (date) return date.toISOString().split('T')[0];
  return null;
}

export class DateRange {
  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.from_str = dateToString(from);
    this.to_str = dateToString(to);
  }
}

export class Data {
  constructor(dateRange) {
    this.df_byday = _filterDataByDate(
      df_byday,
      'date',
      dateRange.from_str,
      dateRange.to_str
    );
    this.df_tasks = _filterDataByDate(
      df_tasks,
      'day_start',
      dateRange.from_str,
      dateRange.to_str
    );
    this.df_months = _filterDataByDate(
      df_months,
      'month',
      dateRange.from_str.substr(0, 7),
      dateRange.to_str.substr(0, 7)
    );
    this.df_weekdays = df_weekdays(
      _filterDataByDate(
        books,
        'date',
        dateRange.from_str.substr(0, 7),
        dateRange.to_str.substr(0, 7)
      )
    );
  }
}

export let boundaries = {
  dateMin: new Date(books['date'].values.at(0)),
  dateMax: new Date(books['date'].values.at(-1)),
};
