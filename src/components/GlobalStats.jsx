import { add, format, formatDuration, intervalToDuration } from 'date-fns';

const GlobalStats = ({ data, dateRange }) => {
  //if (data.isEmpty()) return <p>Nothing to show here.</p>; TODO

  // functions
  const fni = n => <code>{n.toLocaleString('en').replaceAll(',', "'")}</code>;
  const fnd = date => <i>{format(date, 'PPPP')}</i>;
  const duration = (start, end) => formatDuration(intervalToDuration({ start: start, end: end }));

  // compute all values used in render
  const minutes_serie = data.df_byday['minutes'];

  const date_from = dateRange.start;
  const date_to = dateRange.end;
  const days = duration(date_from, add(date_to, { days: 1 })); // TODO: range is not correct (1 year)

  const total_minutes = minutes_serie.sum();
  const total_books = data.df_tasks.shape[0];
  const total_duration = duration(0, total_minutes * 60 * 1000);
  const total_pages = data.df_tasks.pages.sum();

  const days_missed = minutes_serie.apply(n => +(n === 0)).sum();
  const days_sub = minutes_serie.apply(n => +(n > 0 && n < 10)).sum();

  const audiobooks_count = data.df_audio.shape[0];
  const audiobook_minutes = audiobooks_count > 0 ? data.df_audio['minutes'].sum() : 0;
  const audiobook_duration = formatDuration(
    intervalToDuration({ start: 0, end: audiobook_minutes * 60 * 1000 }),
  );

  return (
    <div>
      <p>
        From {fnd(date_from)} to {fnd(date_to)} ({days}), I finished {fni(total_books)} books.
      </p>
      <p>
        I read {total_pages > 0 ? <span>about {fni(total_pages)} pages in </span> : <span></span>}
        {fni(total_minutes)} minutes, which is equivalent to <b>{total_duration}</b> non-stop
        reading.
      </p>
      <p>
        I missed {fni(days_missed)} days (no reading at all), and read less than ten minutes{' '}
        {fni(days_sub)} times.
      </p>
      {audiobooks_count > 0 && (
        <p>
          I also listened to {fni(audiobooks_count)} audiobooks for a total duration of{' '}
          {fni(audiobook_minutes)} minutes, which is equivalent to <b>{audiobook_duration}</b>.
        </p>
      )}
    </div>
  );
};

export default GlobalStats;
