import factory from 'react-plotly.js/factory';
import Plotly from 'plotly.js-cartesian-dist';

// Vite's dep pre-bundler mis-handles this CJS module's `exports.default`,
// yielding the raw module.exports object instead of the factory function
// (reproduced on rolldown-vite 8, dev mode only). Unwrap defensively so it
// works whether or not the bundler resolves interop correctly.
const createPlotlyComponent = (
  typeof factory === 'function'
    ? factory
    : (factory as unknown as { default: typeof factory }).default
) as typeof factory;

const Plot = createPlotlyComponent(Plotly);

export default Plot;
