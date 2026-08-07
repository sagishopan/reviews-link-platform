import React, { useEffect, useState } from 'react';
import { t } from '../locales/index.js';

function StarButton({ index, filled, active, labelNumber, ariaLabel, onClick, pulseSeed }) {
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (!active || pulseSeed === 0) return undefined;
    const delay = (index - 1) * 40;
    const startTimer = setTimeout(() => setPopping(true), delay);
    const endTimer = setTimeout(() => setPopping(false), delay + 180);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseSeed]);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex flex-col items-center gap-1 tap-target focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
    >
      <span className={`text-[15px] font-medium transition-colors ${filled ? 'text-accent' : 'text-gray-400'}`}>{labelNumber}</span>
      <span
        className="relative flex items-center justify-center transition-transform star-box"
        style={{ transform: popping ? 'scale(1.15)' : 'scale(1)', transitionDuration: '180ms' }}
      >
        {filled && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full blur-md"
            style={{ backgroundColor: 'rgba(251, 191, 36, 0.35)' }}
          />
        )}
        <svg viewBox="0 0 24 24" className="relative star-icon" fill={filled ? '#FBBF24' : '#E4E7EC'}>
          <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.8l7.1-.7L12 2.5z" />
        </svg>
      </span>
    </button>
  );
}

export default function Stars({ rating, onSelect, labels }) {
  const [pulseSeed, setPulseSeed] = useState(0);

  const handleClick = (value) => {
    setPulseSeed((s) => s + 1);
    onSelect(value);
  };

  // Star 1 must sit at the right edge regardless of the document's own layout,
  // so the row is forced to LTR box layout and rendered in reverse DOM order
  // (5..1) - that always places star 1 as the last, rightmost item on screen.
  return (
    <div
      className="flex items-start justify-center star-row"
      dir="ltr"
      role="radiogroup"
      aria-label={t.rating.star_group_label}
    >
      {[5, 4, 3, 2, 1].map((value) => (
        <StarButton
          key={value}
          index={value}
          filled={value <= rating}
          active={value <= rating}
          labelNumber={value}
          ariaLabel={labels ? labels[value] : t.rating.star_aria_label.replace('{n}', value)}
          onClick={() => handleClick(value)}
          pulseSeed={pulseSeed}
        />
      ))}
    </div>
  );
}
