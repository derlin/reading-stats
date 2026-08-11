// A titled page section: the h2 on its 2px rule, with an optional ⓘ explainer
// anchored to the right end of that rule.
//
// This exists so the heading and its explainer share one box. The pre-rewrite
// site positioned the ⓘ against the plot container instead, which is why it
// drifted away from the text column on wide screens (a D11 defect).

import type { ReactNode } from 'react';
import InfoPopover from './InfoPopover';
import './Section.scss';

interface SectionProps {
  title: string;
  info?: string;
  children: ReactNode;
}

export default function Section({ title, info, children }: SectionProps) {
  return (
    <section className="section">
      <h2 className="section__heading">
        {title}
        {info && <InfoPopover text={info} />}
      </h2>
      {children}
    </section>
  );
}
