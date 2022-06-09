import './App.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import PlotByDay from './plots/PlotByDay';
import PlotByMonth from './plots/PlotByMonth';
import PlotByWeekday from './plots/PlotByWeekday';
import { DateRange, Data } from './data/Data';
import DatePicker from './components/DateRangePicker';
import React from 'react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dateStart: new Date('2021-05-13'),
      dateEnd: new Date(),
    };

    this.handleSelect = this.handleSelect.bind(this);
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
        <PlotByDay data={data} />
        <PlotByMonth data={data} />
        <PlotByWeekday data={data} />
      </div>
    );
  }
}

export default App;
