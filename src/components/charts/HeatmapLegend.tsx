// The key for a heatmap's colour ramp.
//
// Plotly's own colorbar is deliberately not used: it is a vertical gradient
// strip with library-default chrome, which is exactly the untouched-default
// look D11 rules out, and it cannot express the calendar's hard buckets
// honestly. This renders the same information as flat swatches in the site's
// own language, and sits under the plot where it doesn't steal chart width.

import './charts.scss';

export interface LegendItem {
  color: string;
  /** Rendered under the swatch. Omit on interior steps to label only the ends. */
  label?: string;
}

interface HeatmapLegendProps {
  items: LegendItem[];
  /** Sits to the left of the swatches — e.g. "less" for an unlabelled ramp. */
  before?: string;
  after?: string;
}

export default function HeatmapLegend({ items, before, after }: HeatmapLegendProps) {
  return (
    <div className="heatmap-legend">
      {before && <span className="heatmap-legend__end">{before}</span>}
      {items.map(item => (
        <span className="heatmap-legend__item" key={item.color + (item.label ?? '')}>
          <span className="heatmap-legend__swatch" style={{ backgroundColor: item.color }} />
          {item.label && <span className="heatmap-legend__label">{item.label}</span>}
        </span>
      ))}
      {after && <span className="heatmap-legend__end">{after}</span>}
    </div>
  );
}
