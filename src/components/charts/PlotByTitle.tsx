import type { Data, Layout } from 'plotly.js';
import Plot from '../../lib/plotly';
import PlotEmpty from './PlotEmpty';
import type { BookAggregate } from '../../data/useFilteredData';
import { baseLayout, rule, chartColors } from './chartTheme';

const id = 'plot_title';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Salmon-range shades, cycled per swimlane track so adjacent books in the
// same track stay visually distinct without leaving the D11 palette. Each
// shade pairs with a text color that stays legible on it — accentLight is
// too close to paper for the paper-colored inside-bar text to read.
const trackShades = [
  { fill: chartColors.accent, text: chartColors.paper },
  { fill: chartColors.accentMid, text: chartColors.paper },
  { fill: chartColors.accentLight, text: chartColors.ink },
];

function makeShadeCycler() {
  let i = 0;
  return () => trackShades[i++ % trackShades.length];
}

interface PackedBook extends BookAggregate {
  track: number;
}

/** Packs books into the first swimlane whose last-used end day doesn't overlap this book's start. */
function packTracks(byBook: BookAggregate[]): { packed: PackedBook[]; maxTrack: number } {
  const trackEnd: number[] = [];
  let maxTrack = 0;
  const packed = byBook.map(book => {
    let track = 0;
    while (trackEnd[track] !== undefined && trackEnd[track] > book.dayStart) track++;
    trackEnd[track] = book.dayEnd;
    if (track > maxTrack) maxTrack = track;
    return { ...book, track };
  });
  return { packed, maxTrack };
}

export default function PlotByTitle({ byBook, epoch }: { byBook: BookAggregate[]; epoch: Date }) {
  if (byBook.length === 0) return <PlotEmpty divId={id} />;

  const { packed, maxTrack } = packTracks(byBook);
  const cyclers = Array.from({ length: maxTrack + 1 }, () => makeShadeCycler());

  const dateOf = (dayOffset: number) => new Date(epoch.getTime() + dayOffset * MS_PER_DAY);

  const data: Data[] = packed.map(book => {
    const start = dateOf(book.dayStart);
    // +1 day so a book finished within a single calendar day still renders a visible bar.
    const durationMs = (book.dayEnd - book.dayStart + 1) * MS_PER_DAY;
    const title = book.book.title || '(untitled)';
    const label = title.length < 30 ? title : `${title.slice(0, 30)}...`;
    const author = book.book.author ?? 'unknown author';
    const shade = book.partial
      ? { fill: chartColors.dim, text: chartColors.ink }
      : cyclers[book.track]();

    return {
      type: 'bar',
      orientation: 'h',
      base: [start as unknown as string],
      x: [durationMs],
      width: 1,
      y: [book.track * 1.2],
      text: [label],
      textposition: 'inside',
      insidetextanchor: 'middle',
      insidetextfont: { size: 14, color: shade.text },
      hovertemplate:
        `<b>${title}</b><br>by ${author}<br>read in ${book.days} day${book.days === 1 ? '' : 's'}` +
        (book.book.pages ? ` (${book.book.pages} pages)` : '') +
        (book.partial ? '<br><i>extends beyond the selected range</i>' : '') +
        '<extra></extra>',
      marker: {
        color: shade.fill,
        line: { color: chartColors.ink, width: 1 },
      },
    };
  });

  const layout: Partial<Layout> = {
    ...baseLayout(),
    xaxis: { ...rule(), type: 'date', tickformat: '%Y-%m-%d' },
    yaxis: { showticklabels: false, showline: false, zeroline: false, fixedrange: true },
    showlegend: false,
    autosize: true,
    height: 200 * (maxTrack + 1),
    barmode: 'overlay',
  };

  return (
    <div className="plot-container">
      <Plot divId={id} data={data} layout={layout} style={{}} useResizeHandler={true} />
    </div>
  );
}
