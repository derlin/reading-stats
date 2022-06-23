import { Component } from 'react';
import { add, format, formatDuration, intervalToDuration } from 'date-fns';

export default class Header extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const data = this.props.data;
    if (data.isEmpty()) return <p>Nothing to show here.</p>;

    const minutes_serie = data.df_byday['minutes'];

    const date_from = this.props.dateRange.start;
    const date_to = this.props.dateRange.end;
    const days = this.duration(date_from, add(date_to, { days: 1 })); // TODO: range is not correct (1 year)

    const total_minutes = minutes_serie.sum();
    const total_books = data.df_tasks.shape[0];
    const total_duration = this.duration(0, total_minutes * 60 * 1000);
    const total_pages = data.df_tasks.pages.sum();

    const days_missed = minutes_serie.apply(n => +(n === 0)).sum();
    const days_sub = minutes_serie.apply(n => +(n > 0 && n < 10)).sum();

    return (
      <div>
        <p>
          From {this.fnd(date_from)} to {this.fnd(date_to)} ({days}), I finished{' '}
          {this.fni(total_books)} books.
        </p>
        <p>
          I read about {this.fni(total_pages)} pages in {this.fni(total_minutes)} minutes, which is
          equivalent to <b>{total_duration}</b> non-stop reading.
        </p>
        <p>
          I missed {this.fni(days_missed)} days (no reading at all), and read less than ten minutes{' '}
          {this.fni(days_sub)} times.
        </p>
      </div>
    );
  }

  fni(n) {
    return <code>{n.toLocaleString('en').replaceAll(',', "'")}</code>;
  }

  fnd(date) {
    return <i>{format(date, 'PPPP')}</i>;
  }

  duration(start, end) {
    return formatDuration(intervalToDuration({ start: start, end: end }));
  }
}
