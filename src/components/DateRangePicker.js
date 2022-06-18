import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { Component } from 'react';
import { boundaries } from '../data/Data';
import { set, sub, format } from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './DateRangePicker.css';

const DATE_FORMAT = 'yyyy-MM-dd';

const staticRanges = createStaticRanges([
  {
    label: 'All',
    range: () => ({
      startDate: boundaries.dateMin,
      endDate: boundaries.dateMax,
    }),
  },
  {
    label: 'Current Year',
    range: () => ({
      startDate: set(boundaries.dateMax, { month: 0, day: 1 }),
      endDate: boundaries.dateMax,
    }),
  },
  {
    label: 'Last 6 Months', // TODO
    range: () => ({
      startDate: sub(boundaries.dateMax, { months: 6 }),
      endDate: boundaries.dateMax,
    }),
  },
]);

//staticRanges.forEach(e => console.log(e.range()));

export default class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
    };

    this.selectDates = this.selectDates.bind(this);
    this.togglePicker = this.togglePicker.bind(this);
  }

  render() {
    const start = this.props.dateRange.from ?? boundaries.dateMin;
    const end = this.props.dateRange.to ?? boundaries.dateMax;

    return (
      <div>
        <div id='header'>
          {staticRanges.map((range) => 
          <div onClick={() => this.selectDates({selection: range.range()})}>{range.label}</div>
          )}
          <div onClick={this.togglePicker}>
            {format(start, DATE_FORMAT)} - {format(end, DATE_FORMAT)}
          </div>
        </div>
        <div style={{height: '30px'}}></div>
        {this.state.opened &&  
        <div id="picker">
          <DateRangePicker
            ranges={[{ startDate: start, endDate: end, key: 'selection' }]}
            onChange={this.selectDates}
            minDate={boundaries.dateMin}
            maxDate={boundaries.dateMax}
            staticRanges={staticRanges}
            editableDateInputs={true}
            dateDisplayFormat={DATE_FORMAT}
          />
        </div> }
      </div>
    );
  }

  selectDates(event) {
    this.props.handleSelect({from: event.selection.startDate, to: event.selection.endDate})
  }

  togglePicker() {
    this.setState({ opened: !this.state.opened });
  }
}
