import { Fragment, useRef, useState } from 'react';
import type {
  Data,
  Layout,
  Shape,
  Annotations,
  PlotMouseEvent,
  PlotlyHTMLElement,
} from 'plotly.js';
import Plot from '../../lib/plotly';
import PlotEmpty from './PlotEmpty';
import type { DayAggregate, EnrichedSession } from '../../data/useFilteredData';
import { formatDuration, formatMediumDate } from '../../lib/format';
import { BookMention } from '../BookLink';
import type { Book } from '../../types/payload';
import { baseLayout, rule, chartColors } from './chartTheme';

const id = 'plot_day';
// Alternating book-shading, already in the D11 palette (BRIEF.md §8: the old
// site drew PlotByDay from these two colors without naming them a palette).
const shadeColors = [chartColors.accentLight, chartColors.paper];
// Caps on-chart title labels at roughly one per 1000px/MAX_LABELS of chart
// width, so labels stay legible instead of the illegible smear D11 item 3
// flags — the "fewer labels" fix, chosen over on-hover-only or a legend strip.
const MAX_LABELS = 40;

interface BookSpan {
  title: string;
  dayStart: number;
  dayEnd: number;
  startDate: Date;
  endDate: Date;
}

/** Per-book min/max day within the visible sessions — including unfinished books, unlike groupByBook. */
function groupSpans(sessions: EnrichedSession[]): BookSpan[] {
  const byBook = sessions.reduce((acc, s) => {
    const arr = acc.get(s.bookIndex);
    if (arr) arr.push(s);
    else acc.set(s.bookIndex, [s]);
    return acc;
  }, new Map<number, EnrichedSession[]>());

  return [...byBook.values()]
    .map(sess => {
      const offsets = sess.map(s => s.dayOffset);
      const dates = sess.map(s => s.date.getTime());
      return {
        title: sess[0].book.title || '(untitled)',
        dayStart: Math.min(...offsets),
        dayEnd: Math.max(...offsets),
        startDate: new Date(Math.min(...dates)),
        endDate: new Date(Math.max(...dates)),
      };
    })
    .sort((a, b) => a.dayStart - b.dayStart);
}

/** Greedily keeps a label only if it's at least minGapDays after the last kept one. */
function thinLabels(spans: BookSpan[]): BookSpan[] {
  if (spans.length === 0) return [];
  const totalDays = spans[spans.length - 1].dayEnd - spans[0].dayStart + 1;
  const minGapDays = Math.max(1, Math.floor(totalDays / MAX_LABELS));
  const kept: BookSpan[] = [];
  let lastStart = -Infinity;
  for (const span of spans) {
    if (span.dayStart - lastStart >= minGapDays) {
      kept.push(span);
      lastStart = span.dayStart;
    }
  }
  return kept;
}

interface BookTotal {
  bookIndex: number;
  book: Book;
  minutes: number;
}

/** A day's minutes per book, longest first — the order the breakdown reads best in. */
function bookTotals(day: DayAggregate): BookTotal[] {
  const totals = day.sessions.reduce((acc, s) => {
    const total = acc.get(s.bookIndex);
    if (total) total.minutes += s.minutes;
    else acc.set(s.bookIndex, { bookIndex: s.bookIndex, book: s.book, minutes: s.minutes });
    return acc;
  }, new Map<number, BookTotal>());
  return [...totals.values()].sort((a, b) => b.minutes - a.minutes);
}

/** The click detail's sentence, with the book(s) named the same way the table does — a linked title plus its other providers. */
function DayDetail({ day }: { day: DayAggregate }) {
  const dateLabel = formatMediumDate(day.date);
  const total = formatDuration(day.minutes);
  const books = bookTotals(day);
  // With one book the per-book time is the day's total, so the breakdown would
  // just say the same number twice; it folds into the sentence instead.
  if (books.length === 1) {
    return (
      <>
        On {dateLabel}, I read {total} of <BookMention book={books[0].book} />
      </>
    );
  }
  return (
    <>
      On {dateLabel}, I read {total} —{' '}
      {books.map((b, i) => (
        <Fragment key={b.bookIndex}>
          {i > 0 && ', '}
          <BookMention book={b.book} /> for {formatDuration(b.minutes)}
        </Fragment>
      ))}
    </>
  );
}

function buildShapesAndAnnotations(spans: BookSpan[]) {
  const shapes: Partial<Shape>[] = spans.map((span, i) => ({
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: span.startDate.toISOString(),
    x1: span.endDate.toISOString(),
    y0: 0,
    y1: 1,
    fillcolor: shadeColors[i % 2],
    layer: 'below',
    line: { width: 0 },
  }));

  const annotations: Partial<Annotations>[] = thinLabels(spans).map(span => ({
    text: span.title.length < 30 ? span.title : `${span.title.slice(0, 30)}...`,
    textangle: '-90',
    x: span.startDate.toISOString(),
    xanchor: 'left',
    xshift: 6, // clears the y-axis line when a book's span starts at the chart's left edge
    y: 1,
    yref: 'paper',
    yanchor: 'top',
    showarrow: false,
    font: { size: 10, color: chartColors.ink },
  }));

  return { shapes, annotations };
}

export default function PlotByDay({
  byDay,
  sessions,
}: {
  byDay: DayAggregate[];
  sessions: EnrichedSession[];
}) {
  const [detailDay, setDetailDay] = useState<DayAggregate | null>(null);
  // The handler is attached below by hand, so it outlives the render that
  // created it; reading the days from a ref keeps it describing the currently
  // selected range instead of whatever was selected when the chart mounted.
  const daysRef = useRef(byDay);
  daysRef.current = byDay;

  if (byDay.length < 2) return <PlotEmpty divId={id} />;

  const spans = groupSpans(sessions);
  const { shapes, annotations } = buildShapesAndAnnotations(spans);

  const trace: Data = {
    type: 'scatter',
    mode: 'lines',
    x: byDay.map(d => d.date),
    y: byDay.map(d => d.minutes),
    line: { color: chartColors.ink },
    // Pre-formatted because a hovertemplate can interpolate values but cannot
    // call formatDuration.
    customdata: byDay.map(d => formatDuration(d.minutes)),
    hovertemplate: '%{x|%Y-%m-%d}<br>%{customdata}<extra></extra>',
  };

  const layout: Partial<Layout> = {
    ...baseLayout(),
    shapes,
    annotations,
    // Hit-testing on x alone, so the whole vertical band above a day is
    // hoverable and clickable. Under the default 'closest' the cursor had to
    // land within ~20px of the vertex *in both axes* — and with a point every
    // few pixels on a spiky line and no markers to aim at, that made the click
    // interaction all but unreachable.
    hovermode: 'x',
    xaxis: { ...rule() },
    yaxis: { ...rule(), title: { text: 'minutes' }, fixedrange: true },
    margin: { ...baseLayout().margin, t: 60 },
    // Keeps a zoom across re-renders: clicking a day sets the detail state,
    // which re-renders, and Plotly.react would otherwise snap the x axis back
    // to autorange because the layout it gets carries no explicit range. Keyed
    // to the visible span so picking a new date range *does* reset the zoom —
    // which is what the axis ticks would say anyway. Double-click still
    // autoscales, since that goes through Plotly's own UI state.
    uirevision: `${+byDay[0].date}-${+byDay[byDay.length - 1].date}`,
  };

  const onClick = (event: Readonly<PlotMouseEvent>) => {
    const day = daysRef.current[event.points[0].pointIndex];
    if (!day) return;
    setDetailDay(day);
  };

  /**
   * Subscribes to Plotly's click directly instead of using react-plotly.js's
   * `onClick` prop, which is silently dropped on a freshly loaded page: React's
   * StrictMode mounts the component twice, react-plotly.js purges the graph
   * div's Plotly listeners on the intervening unmount, and its
   * `syncEventHandlers` then re-attaches nothing because the handler's identity
   * hasn't changed. Clicking did nothing at all until some unrelated state
   * change (picking a date preset — or an HMR update, which is why this looked
   * fine in development) forced a re-render and a rebind.
   *
   * `onInitialized` runs on every mount, after that purge, so binding here
   * survives the double mount and the interaction works from the first paint.
   */
  const bindClick = (_figure: unknown, graphDiv: Readonly<HTMLElement>) => {
    (graphDiv as PlotlyHTMLElement).on('plotly_click', onClick);
  };

  return (
    <div className="plot-container plot-container--interactive">
      <p className="plot-detail">
        {detailDay ? <DayDetail day={detailDay} /> : 'Click any day to see details'}
      </p>
      <Plot
        divId={id}
        data={[trace]}
        layout={layout}
        style={{ width: '100%' }}
        useResizeHandler={true}
        onInitialized={bindClick}
      />
    </div>
  );
}
