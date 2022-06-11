import './App.css';

import PlotByDay from './plots/PlotByDay';
import PlotByMonth from './plots/PlotByMonth';
import PlotByWeekday from './plots/PlotByWeekday';
import { DateRange, Data, boundaries } from './data/Data';
import DatePicker from './components/DateRangePicker';
import { set } from 'date-fns';
import React from 'react';
import BookTable from './components/BookTable';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dateStart: boundaries.dateMin,
      dateEnd: boundaries.dateMax,
    };

    this.handleSelect = this.handleSelect.bind(this);
  }

  stripTime(dt) {
    return set(dt, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  }

  handleSelect(event) {
    this.setState({
      dateStart: event.selection.startDate,
      dateEnd: event.selection.endDate,
    });
    console.log('handle select', event);
  }

  render() {
    console.log('### render root');
    const dateRange = new DateRange(this.state.dateStart, this.state.dateEnd);
    const data = new Data(dateRange);

    return (
      <div>
        <DatePicker dateRange={dateRange} handleSelect={this.handleSelect} />
        <h2>Reading per day</h2>
        <PlotByDay data={data} />
        <h2>Reading per month</h2>
        <PlotByMonth data={data} />
        <h2>Reading per weekday</h2>
        <PlotByWeekday data={data} />
        <h2>Books read</h2>
        <BookTable data={data} />
      </div>
    );
  }
}

export default App;
