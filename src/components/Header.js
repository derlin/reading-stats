import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { Component } from 'react';
import { boundaries } from '../data/Data';
import { set, sub, format } from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './Header.scss';

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
  ...boundaries.years.map(year => ({
    label: year,
    range: () => ({ startDate: new Date(`${year}-01-01`), endDate: new Date(`${year}-12-31`) }),
  })),
]);

//staticRanges.forEach(e => console.log(e.range()));

export default class Header extends Component {
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
      <div id="top-row">
        <div id="header">
          <div className="current">
            <span onClick={this.togglePicker}>
              {format(start, DATE_FORMAT)} → {format(end, DATE_FORMAT)}
              <span className="icon">{this.state.opened ? ' ✕' : ' ✎'}</span>
            </span>

            <div className="picker">
              {this.state.opened && (
                <DateRangePicker
                  ranges={[{ startDate: start, endDate: end, key: 'selection' }]}
                  onChange={this.selectDates}
                  minDate={boundaries.dateMin}
                  maxDate={boundaries.dateMax}
                  staticRanges={staticRanges}
                  editableDateInputs={true}
                  dateDisplayFormat={DATE_FORMAT}
                />
              )}
            </div>
          </div>
          {staticRanges.map(range => (
            <div
              key={range.label}
              className="btn"
              onClick={() => this.selectDates({ selection: range.range() })}
            >
              {range.label}
            </div>
          ))}
        </div>
        <div style={{ height: '50px' }}></div>
      </div>
    );
  }

  selectDates(event) {
    this.props.handleSelect({ from: event.selection.startDate, to: event.selection.endDate });
  }

  togglePicker() {
    this.setState({ opened: !this.state.opened });
  }
}
