import * as dfd from "danfojs";

const books = new dfd.DataFrame(require("./all.json"));

const df_byday = books
  .groupby(["date"])
  .apply((row) => {
    return new dfd.DataFrame({
      minutes_sum: [row["minutes"].sum()],
      tasks: [row["task"].unique().values.join(", ")],
    });
  })
  .rename({ date_Group: "date", minutes_sum: "minutes" })
  .resetIndex();

const df_tasks = books
  .iloc({ rows: books["task_done"] })
  .groupby(["task"])
  .apply((row) => {
    let dates = row["date"].values;

    return new dfd.DataFrame({
      minutes: [row["minutes"].sum()],
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

function _filterDataByDate(df, column, from_date, to_date) {
  if (from_date)
    df = df
      .iloc({ rows: df[column].apply((x) => x >= from_date) })
      .resetIndex();
  if (to_date)
    df = df.iloc({ rows: df[column].apply((x) => x < to_date) }).resetIndex();
  return df;
}

function dateToString(date) {
  if (date) return date.toISOString().split("T")[0];
  return null;
}

export class DateRange {
  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.from_str = dateToString(from);
    this.to_str = dateToString(to);
    console.log(this.from_str, this.to_str);
  }
}

export class Data {
  constructor(dateRange) {
    this.df_byday = _filterDataByDate(
      df_byday,
      "date",
      dateRange.from_str,
      dateRange.to_str
    );
    this.df_tasks = _filterDataByDate(
      df_tasks,
      "day_start",
      dateRange.from_str,
      dateRange.to_str
    );
  }
}

export let boundaries = {
  dateMin: new Date(books["date"].values.at(0)),
  dateMax: new Date(books["date"].values.at(-1)),
};
