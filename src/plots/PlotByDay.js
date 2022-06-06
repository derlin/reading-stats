import * as dfd from "danfojs";
import Plot from "react-plotly.js";
import { df_byday, df_tasks } from "../data/df";

const colors = ["LightSalmon", "beige"];


function PlotByDay() {
  let current_color = true
  const shapes = []
  const annotations = []

  dfd.toJSON(df_tasks).forEach((x) => {
    
    current_color = !current_color;
    shapes.push({
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: x["day_start"],
      y0: 0,
      x1: x["day_end"],
      y1: 1,
      fillcolor: colors[+current_color],
      opacity: 0.2,
      line: {
        width: 0,
      },
    });

    const task = x["task_Group"];
    annotations.push({
      text: task.length < 30 ? task : task.substring(0, 30) + "...",
      textangle: -90,
      x: x["day_start"],
      xanchor: "left",
      //y: 400,
      // with ref=paper, y=0 mean bottom, y=1 means top of the plot
      y: 1,
      yref: "paper",
      yanchor: "top",
      showarrow: false,
    });
  });


  return (
    <Plot
      data={[
        {
          x: df_byday["date_Group"].values,
          y: df_byday["minutes_sum"].values,
          type: "line",
          mode: "lines",
          text: df_byday["tasks"].values,
        },
      ]}
      style={{ width: "100%", height: "100%" }}
      layout={{
        title: "Reading per day",
        shapes: shapes,
        annotations: annotations,
      }}
      useResizeHandler={true}
    />
  );
}

export default PlotByDay;
