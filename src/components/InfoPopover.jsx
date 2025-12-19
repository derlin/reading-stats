import { useState, useRef, useEffect } from 'react';
import './InfoPopover.scss';

export default function InfoPopover({ text }) {
  const [show, setShow] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const toggle = () => setShow(!show);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        show &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);

  return (
    <div className="info-popover-container">
      <button
        ref={buttonRef}
        onClick={toggle}
        className="info-button"
        aria-label="Show plot information"
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
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>
      {show && (
        <div ref={popoverRef} className="info-popover-content" role="tooltip">
          {text}
        </div>
      )}
      <div className="seo-only">
        <figcaption>{text}</figcaption>
      </div>
    </div>
  );
}
