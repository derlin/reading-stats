import Plot from '../../lib/plotly';
import { noDataLayout } from './chartTheme';

export default function PlotEmpty({ divId }: { divId: string }) {
  return <Plot divId={divId} data={[]} layout={noDataLayout()} />;
}
