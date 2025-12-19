import { DateRange } from 'react-date-range';
import { Component } from 'react';
import { boundaries } from '../data/Data';
import { set, add, sub, format, max } from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './Header.scss';

const DATE_FORMAT = 'yyyy-MM-dd';

const sepAt = 3;
/* This respects the format of DateRangePicker */
const staticRanges = [
  {
    label: 'All',
    start: boundaries.minDate,
    end: boundaries.maxDate,
  },
  {
    label: 'Last 6 Months',
    // add one day, since the limits are inclusive (we have the full first and last days)
    start: add(sub(boundaries.maxDate, { months: 6 }), { days: 1 }),
    end: boundaries.maxDate,
  },
  {
    label: 'This Year',
    start: set(boundaries.maxDate, { month: 0, date: 1 }),
    end: boundaries.maxDate,
  },
  ...boundaries.years
    .reverse()
    .slice(1)
    .map(year => ({
      label: year,
      start: max([boundaries.minDate, new Date(`${year}-01-01`)]),
      end: new Date(`${year}-12-31`),
    })),
];

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
      <>
        <div id="top-row">
          <div id="header">
            {this.renderDatePicker('date')}
            {this.renderPresets()}
          </div>
        </div>
        {this.state.opened && <div className="backdrop" onClick={this.togglePicker}></div>}
      </>
    );
  }

  renderDatePicker(className) {
    const dr = this.props.dateRange;

    return (
      <div className={className}>
        <span className="btn" onClick={this.togglePicker}>
          {dr.start_str} → {dr.end_str}
          <span className="icon">{this.state.opened ? ' ✕' : ' ✎'}</span>
        </span>

        <div className="picker">
          {this.state.opened && (
            <DateRange
              ranges={[{ startDate: dr.start, endDate: dr.end, key: 'selection' }]}
              onChange={e => this.selectDates(e.selection.startDate, e.selection.endDate)}
              minDate={boundaries.minDate}
              maxDate={boundaries.maxDate}
              editableDateInputs={true}
              retainEndDateOnFirstSelection={true}
              dateDisplayFormat={DATE_FORMAT}
            />
          )}
        </div>
      </div>
    );
  }

  renderPresets() {
    const selectedLabel = this.getSelectedRangeLabel(this.props.dateRange);

    const ranges = staticRanges.map(range => (
      <span
        key={range.label}
        className={'btn ' + (selectedLabel === range.label ? 'focus' : '')}
        onClick={() => this.selectDates(range.start, range.end)}
      >
        {range.label}
      </span>
    ));
    // insert some sep for the layout flex (where to break)
    ranges.splice(sepAt, 0, <span className="sep" key={'sep'}></span>);
    return ranges;
  }

  getSelectedRangeLabel(dr) {
    return staticRanges
      .filter(
        range =>
          format(range.start, DATE_FORMAT) === dr.start_str &&
          format(range.end, DATE_FORMAT) === dr.end_str,
      )
      .map(range => range.label)?.[0];
  }

  selectDates(startDate, endDate) {
    this.props.selectDates({ startDate, endDate });
  }

  togglePicker() {
    this.setState({ opened: !this.state.opened });
  }

  static getRangeFromLabel(label) {
    return staticRanges.filter(range => range.label === label)[0];
  }
}
