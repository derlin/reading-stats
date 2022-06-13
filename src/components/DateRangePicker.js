import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { Component } from 'react';
import { boundaries } from '../data/Data';
import { set, sub } from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './DateRangePicker.css';

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
      startDate: sub(new Date(), { months: 6 }),
      endDate: new Date(),
    }),
  },
]);

//staticRanges.forEach(e => console.log(e.range()));

class DatePicker extends Component {
  render() {
    const selectionRange = {
      startDate: this.props.dateRange.from ?? new Date('2021-05-01'),
      endDate: this.props.dateRange.to ?? new Date(),
      key: 'selection',
    };
    return (
      <div id="picker">
        <DateRangePicker
          ranges={[selectionRange]}
          onChange={this.props.handleSelect}
          minDate={boundaries.dateMin}
          maxDate={boundaries.dateMax}
          staticRanges={staticRanges}
          editableDateInputs={true}
          dateDisplayFormat={'yyyy-MM-dd'}
        />
      </div>
    );
  }
}

export default DatePicker;
