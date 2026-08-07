import React from 'react';
import { formatShortDate, formatNumber } from '../formatters.js';
import { t } from '../../locales/index.js';

const WIDTH = 600;
const HEIGHT = 220;
const PAD_LEFT = 28;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

export default function LineChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-[220px] flex items-center justify-center text-admin-body text-sm">{t.admin.charts.no_data}</div>;
  }

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxY = 5;

  const points = data.map((d, i) => {
    const x = PAD_LEFT + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = PAD_TOP + innerH - (Math.max(0, Math.min(maxY, d.avg_rating)) / maxY) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${PAD_TOP + innerH} L ${points[0].x.toFixed(1)} ${PAD_TOP + innerH} Z`;

  const yTicks = [0, 1, 2, 3, 4, 5];
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" preserveAspectRatio="none" style={{ minHeight: 200 }}>
      <defs>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A6CF7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4A6CF7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = PAD_TOP + innerH - (tick / maxY) * innerH;
        return (
          <g key={tick}>
            <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} stroke="#EEF0F6" strokeWidth="1" />
            <text x={0} y={y + 3} fontSize="9" fill="#9CA3AF">
              {formatNumber(tick)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#lineArea)" />
      <path d={linePath} fill="none" stroke="#4A6CF7" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#4A6CF7" />
      ))}

      {points.map((p, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={p.x} y={HEIGHT - 6} fontSize="9" fill="#9CA3AF" textAnchor="middle">
            {formatShortDate(p.day)}
          </text>
        ) : null
      )}
    </svg>
  );
}
