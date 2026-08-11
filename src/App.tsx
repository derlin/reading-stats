// The page. Replaces the B2/B3/B4 smoke-test scaffold that rendered the three
// charts and nothing else.
//
// Now bound to the real generated payload rather than the handwritten fixture
// (copied from reading-challenge, workstream A). The fixture stays in
// src/data/fixtures/ — it covers edge cases the real data doesn't currently
// contain, so it is still the thing to develop new views against.

import { useMemo } from 'react';
import { payload } from './data/payload';
import {
  computeYearlyStats,
  enrichSessions,
  parseDateOnly,
  useFilteredData,
} from './data/useFilteredData';
import { useDateRange } from './data/useDateRange';
import Header from './components/Header';
import Section from './components/Section';
import GlobalStats from './components/GlobalStats';
import YearGlance from './components/YearGlance';
import BookTable from './components/BookTable';
import ScrollToTopButton from './components/ScrollToTopButton';
import PlotByTitle from './components/charts/PlotByTitle';
import PlotByDay from './components/charts/PlotByDay';
import PlotByMonth from './components/charts/PlotByMonth';
import PlotTimeOfDay from './components/charts/PlotTimeOfDay';
import PlotCalendar from './components/charts/PlotCalendar';
import './App.scss';

const epoch = parseDateOnly(payload.epoch);

const INFO_BY_TITLE = `This timeline visualizes my journey through different books. Each bar is a
single book, charting its reading period from start to finish. Unfinished books are not shown, and
books whose reading extends outside the selected range are drawn in a muted tint. Hover over any bar
to see the book's title, author, and how many days it took to read.`;

const INFO_BY_DAY = `Daily reading habits: total minutes read each day. Click anywhere on the chart
to see exactly which books I read that day, and for how long. The shaded bands behind the line show which book was
being read; only some are labelled, so the titles stay legible at any zoom level. Drag across the
chart to zoom into any stretch of it, and double-click to zoom back out.`;

const INFO_BY_MONTH = `A monthly overview of my reading time. Each bar is a month's total in minutes.
Hover over any bar for more detail, including the daily average, minimum and maximum for that month.`;

const INFO_TIME_OF_DAY = `When I actually read, by hour and weekday. Each row is scaled to its own
busiest hour rather than to a scale shared with the other days — otherwise the weeknight bedtime
habit would swamp the weekends, where reading is genuinely spread across the day. So colour compares
hours within one weekday; hover for the absolute minutes to compare across rows. A session's time is
split across every hour it ran into, not charged whole to the hour it started in.`;

const INFO_CALENDAR = `Every day in the selected range, one cell per day, shaded by how long I read.
Unlike the time-of-day heatmap further down, the colour scale here is shared by every cell, so days
are directly comparable. Days I read nothing are marked separately — there are few enough of them to be worth
spotting. Drag across the chart to zoom into any stretch of it, and double-click to zoom back out.`;

export default function App() {
  const { range, boundaries, presets, selectedPreset, setRange } = useDateRange(payload);
  const { byMonth, byDay, byHourWeekday, byBook, finishedBooks, sessions, summary } =
    useFilteredData(payload, range);

  const allSessions = useMemo(() => enrichSessions(payload), []);
  const yearlyStats = useMemo(() => computeYearlyStats(payload, allSessions), [allSessions]);

  return (
    <>
      <Header
        range={range}
        boundaries={boundaries}
        presets={presets}
        selectedPreset={selectedPreset}
        onChange={setRange}
      />

      <main className="page">
        <Section title="Overview">
          <GlobalStats summary={summary} range={range} />
          <YearGlance stats={yearlyStats} boundaries={boundaries} onSelect={setRange} />
        </Section>

        <Section title="Reading calendar" info={INFO_CALENDAR}>
          <PlotCalendar byDay={byDay} range={range} />
        </Section>

        <Section title="Finished books" info={INFO_BY_TITLE}>
          <PlotByTitle byBook={byBook} epoch={epoch} />
        </Section>

        <Section title="Reading per day" info={INFO_BY_DAY}>
          <PlotByDay byDay={byDay} sessions={sessions} />
        </Section>

        <Section title="Reading per month" info={INFO_BY_MONTH}>
          <PlotByMonth byMonth={byMonth} />
        </Section>

        <Section title="Time of day" info={INFO_TIME_OF_DAY}>
          <PlotTimeOfDay byHourWeekday={byHourWeekday} />
        </Section>

        <Section title="(Audio)books read">
          <BookTable byBook={finishedBooks} epoch={epoch} />
        </Section>
      </main>

      <ScrollToTopButton />
    </>
  );
}
