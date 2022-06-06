import * as dfd from "danfojs";

const books = new dfd.DataFrame(require("./all.json"));

export let df_byday = books.groupby(["date"]).apply((x) => {
  return new dfd.DataFrame({
    minutes_sum: [x["minutes"].sum()],
    tasks: [x["task"].unique().values.join(", ")],
  });
});

export let df_tasks = books
  .iloc({ rows: books["task_done"] })
  .groupby(["task"])
  .apply((x) => {
    let dates = x["date"].values;
    let date0 = dates[0],
      date1 = dates[dates.length - 1];

    return new dfd.DataFrame({
      minutes: [x["minutes"].sum()],
      day_start: [date0],
      day_end: [date1],
      days: [
        Math.ceil(
          Math.abs(new Date(date1) - new Date(date0)) / (24 * 60 * 60 * 1000)
        ),
      ],
    });
  });