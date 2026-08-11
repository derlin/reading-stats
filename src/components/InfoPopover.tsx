// The ⓘ explainer attached to a section heading.
//
// D11 logged the old placement as a defect: it was absolutely positioned
// against the plot container at the far right of the viewport, detached from
// the text column, and on mobile it landed on top of the heading rule. It now
// anchors to the right end of the heading rule itself (see Section.scss), so
// it tracks the content width at every breakpoint instead of the window.

import { useEffect, useRef, useState } from 'react';
import './InfoPopover.scss';

export default function InfoPopover({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!show) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setShow(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setShow(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show]);

  return (
    <span className="info-popover">
      <button
        ref={buttonRef}
        type="button"
        className="info-popover__button"
        aria-expanded={show}
        aria-label="About this chart"
        onClick={() => setShow(!show)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>
      {show && (
        <span ref={popoverRef} className="info-popover__content" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
