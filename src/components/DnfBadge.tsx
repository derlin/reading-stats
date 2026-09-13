// The "did not finish" mark, on a book wherever it is named: the table's title
// cell, the dialog's heading, a grid tile's corner. One component so the three
// cannot end up saying it differently.

import './DnfBadge.scss';

/** `className` places it; the paint is the base class. */
export default function DnfBadge({ className }: { className?: string }) {
  return (
    <span className={`dnfBadge${className ? ` ${className}` : ''}`} title="Did not finish">
      DNF
    </span>
  );
}
