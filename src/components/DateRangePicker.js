import { DateRangePicker, createStaticRanges } from "react-date-range";
import { Component } from "react";
import {boundaries} from '../data/Data';

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
        startDate: new Date(`${boundaries.dateMax.getFullYear()}-01-01`),
        endDate: new Date(`${boundaries.dateMax.getFullYear()}-12-31`),
      }),
    },
    {
      label: 'Last 6 Months', // TODO
      range: () => ({
        startDate: new Date(),
        endDate: new Date().add(-1).months(),
      }),
    },
  ]);


class DatePicker extends Component {

    constructor(props) {
        super(props);
    }
    
    render() {
    const selectionRange = {
      startDate: this.props.dateRange.from ?? new Date("2021-05-01"),
      endDate: this.props.dateRange.to ?? new Date(),
      key: "selection",
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
