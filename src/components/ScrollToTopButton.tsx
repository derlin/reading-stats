// Rewritten rather than ported: the original was the site's only
// styled-components user (dropped in B1, since D9 requires picking one
// styling approach), and it was purple — a colour belonging to no palette on
// the page, which D11 logs as a defect.
//
// It also registered a scroll listener on every render and never removed one,
// so listeners accumulated for the lifetime of the page.

import { useEffect, useState } from 'react';
import './ScrollToTopButton.scss';

const MIN_SCROLL_TO_REVEAL = 300;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(document.documentElement.scrollTop > MIN_SCROLL_TO_REVEAL);
    onScroll(); // a reload can restore a scrolled position without firing a scroll event
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-to-top"
      aria-label="Scroll back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  );
}
