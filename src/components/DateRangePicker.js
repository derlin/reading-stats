import { DateRangePicker, createStaticRanges } from "react-date-range";
import { Component } from "react";
import {boundaries} from '../data/Data'


const staticRanges = createStaticRanges([
    {
      label: 'Last Year',
      range: () => ({
        startDate: new Date('2021-01-01'),
        endDate: new Date('2022-01-01'),
      }),
    },
    {
      label: 'Last 6 Months',
      range: () => ({
        startDate: new Date('2021-06-04'),
        endDate: new Date('2022-01-01'),
      }),
    },
  ]);

class DatePicker extends Component {

    constructor(props) {
        super(props);
    }
    
    render() {
      console.log('@@@@', boundaries)
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