import React from 'react';
import { formatNumber } from '../formatters.js';
import { t } from '../../locales/index.js';

function colorFor(value, max) {
  if (!value) return '#FFFFFF';
  const ratio = Math.min(1, value / (max || 1));
  // green (low) -> yellow -> orange -> red (high)
  const stops = [
    { t: 0, c: [220, 252, 231] },
    { t: 0.34, c: [253, 224, 71] },
    { t: 0.67, c: [251, 146, 60] },
    { t: 1, c: [239, 68, 68] },
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (ratio >= stops[i].t && ratio <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const localT = (ratio - a.t) / span;
  const rgb = a.c.map((v, i) => Math.round(v + (b.c[i] - v) * localT));
  return `rgb(${rgb.join(',')})`;
}

export default function Heatmap({ grid, max, weekdayLabels, hours }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th />
            {hours.map((h) => (
              <th key={h} className="text-[10px] font-normal text-admin-body" style={{ minWidth: 20 }}>
                {formatNumber(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekdayLabels.map((label, dayIdx) => (
            <tr key={label}>
              <td className="text-xs text-admin-body pl-2 whitespace-nowrap">{label}</td>
              {hours.map((h) => {
                const value = grid[`${dayIdx}-${h}`] || 0;
                return (
                  <td key={h}>
                    <div
                      title={`${label} ${formatNumber(h)}:00 - ${formatNumber(value)} ${t.admin.analytics.complaints_suffix}`}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: colorFor(value, max),
                        border: value ? 'none' : '1px solid #E5E7EB',
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
