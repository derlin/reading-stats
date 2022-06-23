import { DateRange, createStaticRanges } from 'react-date-range';
import { Component } from 'react';
import { boundaries } from '../data/Data';
import { set, add, sub, format, max } from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './Header.scss';

const DATE_FORMAT = 'yyyy-MM-dd';

/* This respects the format of DateRangePicker */
const staticRanges = createStaticRanges([
  {
    label: 'All',
    range: () => ({
      startDate: boundaries.dateMin,
      endDate: boundaries.dateMax,
    }),
  },
  {
    label: 'Last 6 Months',
    range: () => ({
      // add one day, since the limits are inclusive (we have the full first and last days)
      startDate: add(sub(boundaries.dateMax, { months: 6 }), { days: 1 }),
      endDate: boundaries.dateMax,
    }),
  },
  {
    label: 'This Year',
    range: () => ({
      startDate: set(boundaries.dateMax, { month: 0, day: 1 }),
      endDate: boundaries.dateMax,
    }),
  },
  ...boundaries.years
    .reverse()
    .slice(1)
    .map(year => ({
      label: year,
      range: () => ({
        startDate: max([boundaries.dateMin, new Date(`${year}-01-01`)]),
        endDate: new Date(`${year}-12-31`),
      }),
    })),
]);

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      selectedBtn: '',
    };

    this.selectDates = this.selectDates.bind(this);
    this.togglePicker = this.togglePicker.bind(this);
  }

  render() {
    return (
      <div id="top-row">
        <div id="header">
          {this.renderDatePicker('current')}
          {this.renderPresets()}
        </div>
      </div>
    );
  }

  renderDatePicker(className) {
    const dr = this.props.dateRange;

    return (
      <div className={className}>
        <span className="btn" onClick={this.togglePicker}>
          {dr.from_str} → {dr.to_str}
          <span className="icon">{this.state.opened ? ' ✕' : ' ✎'}</span>
        </span>

        <div className="picker">
          {this.state.opened && (
            <DateRange
              ranges={[{ startDate: dr.from, endDate: dr.to, key: 'selection' }]}
              onChange={this.selectDates}
              minDate={boundaries.dateMin}
              maxDate={boundaries.dateMax}
              editableDateInputs={true}
              dateDisplayFormat={DATE_FORMAT}
            />
          )}
        </div>
      </div>
    );
  }

  renderPresets() {
    // TODO: clean it up
    const focused = this.getSelectedRangeLabel()

    return staticRanges.map(range => (
      <span
        key={range.label}
        className={'btn ' + (focused === range.label ? 'focus' : '')}
        onClick={() => this.selectDates({ selection: range.range() }, range.label)}
      >
        {range.label}
      </span>
    ));
  }

  getSelectedRangeLabel() {
    // TODO: do it better
    const dr = this.props.dateRange;
    return staticRanges
      .filter(  range =>
          format(range.range().startDate, DATE_FORMAT) == dr.from_str && format(range.range().endDate, DATE_FORMAT) == dr.to_str
      )
      .map(range => range.label)?.[0];
  }

  selectDates(event, selectedBtn) {
    this.props.handleSelect({ from: event.selection.startDate, to: event.selection.endDate });
    this.setState({ selectedBtn: selectedBtn ?? '' });
  }

  togglePicker() {
    this.setState({ opened: !this.state.opened });
  }
}
