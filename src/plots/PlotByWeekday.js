import Plot from "react-plotly.js";

function PlotByWeekday(props) {
  const df = props.data.df_weekdays;

  return (
    <Plot
      data={[
        {
          type: "bar",
          x: df["weekday"].values,
          y: df["minutes"].values,
          hovertext: df['details'].values,
          text: df['text'].values,
          marker: {color: '#279658'},
        },
      ]}
      style={{ width: "100%", height: "100%" }}
      layout={{
        title: "Reading per weekday",
        xaxis: {type: 'category'}, // show all dates
        yaxis: {title: "minutes"},
      }}
      useResizeHandler={true}
    />
  );
}

export default PlotByWeekday;
