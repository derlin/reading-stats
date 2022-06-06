import { DateRangePicker } from "react-date-range";
import { Component } from "react";
import {boundaries} from '../data/Data'

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
      />
    );
  }
}

export default DatePicker;
