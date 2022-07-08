import React from 'react';

import { DateRange, Data, boundaries } from './data/Data';
import Header from './components/Header';
import PlotByDay from './plots/PlotByDay';
import PlotByMonth from './plots/PlotByMonth';
import PlotByWeekday from './plots/PlotByWeekday';
import BookTable from './components/BookTable';
import GlobalStats from './components/GlobalStats';
import './App.scss';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: boundaries.minDate,
      endDate: boundaries.maxDate,
    };

    this.selectDates = this.selectDates.bind(this);
  }

  selectDates(event) {
    this.setState(
      {
        startDate: event.startDate,
        endDate: event.endDate,
      },
      () => console.log('new state', this.state)
    );
  }

  render() {
    console.log('### render root');
    const dateRange = new DateRange(this.state.startDate, this.state.endDate);
    window.dr = dateRange;
    const data = new Data(dateRange);

    return (
      <div>
        <Header dateRange={dateRange} selectDates={this.selectDates} />
        <h2>Overview</h2>
        <GlobalStats data={data} dateRange={dateRange} />
        <h2>Reading per day</h2>
        <PlotByDay data={data} dateRange={dateRange} />
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
