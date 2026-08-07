import React from 'react';
import { t } from '../../locales/index.js';

export function StarBadge({ rating }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
    >
      <svg viewBox="0 0 24 24" width={12} height={12} fill="#F59E0B">
        <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.8l7.1-.7L12 2.5z" />
      </svg>
      {rating.toLocaleString('he-IL')}
    </span>
  );
}

const SENTIMENT_COLORS = {
  positive: { bg: '#DCFCE7', text: '#166534' },
  neutral: { bg: '#F3F4F6', text: '#4B5563' },
  negative: { bg: '#FCE7F3', text: '#9D174D' },
};

export function SentimentTag({ sentiment }) {
  const c = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral;
  const label = t.admin.sentiment[sentiment] || t.admin.sentiment.neutral;
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
      {label}
    </span>
  );
}

const STATUS_COLORS = {
  pending: { bg: '#FFEDD5', text: '#9A3412' },
  in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
  resolved: { bg: '#DCFCE7', text: '#166534' },
  closed: { bg: '#F3F4F6', text: '#4B5563' },
};

export function StatusTag({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = t.admin.status[status] || t.admin.status.pending;
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
      {label}
    </span>
  );
}

export const STATUS_LABELS = t.admin.status;
