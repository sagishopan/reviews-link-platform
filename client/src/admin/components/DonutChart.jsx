import React from 'react';
import { formatNumber } from '../formatters.js';

const SIZE = 200;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export default function DonutChart({ segments, total, centerLabel }) {
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#F3F4F6" strokeWidth={STROKE} />
        {segments.map((seg) => {
          if (!seg.value || total === 0) return null;
          const fraction = seg.value / total;
          const dash = fraction * CIRC;
          const el = (
            <circle
              key={seg.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              opacity={seg.dimmed ? 0.25 : 1}
              style={{ transition: 'opacity 150ms' }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold text-admin-heading" style={{ fontSize: 32 }}>
          {formatNumber(total)}
        </span>
        <span className="text-admin-body text-xs">{centerLabel}</span>
      </div>
    </div>
  );
}
