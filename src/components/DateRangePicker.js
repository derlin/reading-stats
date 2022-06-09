import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { Component } from 'react';
import { boundaries } from '../data/Data';
import { add, set, sub } from 'date-fns';

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
      startDate: sub(new Date(), { months: 6}),
      endDate: new Date(),
    }),
  },
]);

staticRanges.forEach(e => console.log(e.range()))

class DatePicker extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const selectionRange = {
      startDate: this.props.dateRange.from ?? new Date('2021-05-01'),
      endDate: this.props.dateRange.to ?? new Date(),
      key: 'selection',
    };
    return (
      <DateRangePicker
        ranges={[selectionRange]}
        onChange={this.props.handleSelect}
        minDate={boundaries.dateMin}
        maxDate={boundaries.dateMax}
        staticRanges={staticRanges}
      />
    );
  }
}

export default DatePicker;
