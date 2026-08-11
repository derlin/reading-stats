// The global date-range control.
//
// Replaces the pre-rewrite `react-date-range` calendar popover, which was
// dropped in B1 along with date-fns: it shipped its own default theme CSS,
// which is exactly the library-default look D11 rules out, and overriding it
// wholesale cost more than the control is worth. Two native date inputs do
// the same job, need no dependency, and get a real picker on mobile for free.
//
// The bar is sticky rather than fixed so it reserves its own height instead of
// needing a spacer, and is constrained to the content width — D11 item 2, and
// the fix for the "top bar left-aligned while the page is centred" defect.

import type { DateRange } from '../data/useFilteredData';
import { formatDateOnly, parseDateOnly } from '../data/useFilteredData';
import type { Boundaries, Preset } from '../data/useDateRange';
import './Header.scss';

interface HeaderProps {
  range: DateRange;
  boundaries: Boundaries;
  presets: Preset[];
  selectedPreset: string | undefined;
  onChange: (range: DateRange) => void;
}

export default function Header({
  range,
  boundaries,
  presets,
  selectedPreset,
  onChange,
}: HeaderProps) {
  const min = formatDateOnly(boundaries.minDate);
  const max = formatDateOnly(boundaries.maxDate);

  // An empty value means the field was cleared mid-edit; keep the last good
  // range rather than collapsing it. Dragging one bound past the other pushes
  // the other along instead of producing an inverted range.
  const setStart = (value: string) => {
    if (!value) return;
    const start = parseDateOnly(value);
    onChange({ start, end: start > range.end ? start : range.end });
  };

  const setEnd = (value: string) => {
    if (!value) return;
    const end = parseDateOnly(value);
    onChange({ start: end < range.start ? end : range.start, end });
  };

  return (
    <header className="top-bar">
      <div className="top-bar__inner">
        <div className="top-bar__range">
          <input
            type="date"
            className="date-input"
            aria-label="Range start"
            value={formatDateOnly(range.start)}
            min={min}
            max={max}
            onChange={e => setStart(e.target.value)}
          />
          <span className="top-bar__arrow" aria-hidden="true">
            →
          </span>
          <input
            type="date"
            className="date-input"
            aria-label="Range end"
            value={formatDateOnly(range.end)}
            min={min}
            max={max}
            onChange={e => setEnd(e.target.value)}
          />
        </div>

        <div className="top-bar__presets">
          {presets.map(preset => (
            <button
              key={preset.label}
              type="button"
              className={`btn${selectedPreset === preset.label ? ' focus' : ''}`}
              aria-pressed={selectedPreset === preset.label}
              onClick={() => onChange(preset.range)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
