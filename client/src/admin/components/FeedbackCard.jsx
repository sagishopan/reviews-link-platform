import React from 'react';
import { StarBadge, SentimentTag, StatusTag } from './Badges.jsx';
import { CATEGORY_LABELS } from '../categoryLabels.js';
import { formatDateTime } from '../formatters.js';
import { t } from '../../locales/index.js';

const tf = t.admin.feedback;
const STATUS_OPTIONS = Object.entries(t.admin.status).map(([value, label]) => ({ value, label }));

export default function FeedbackCard({ item, onStatusChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-admin-body">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>{formatDateTime(item.created_at)}</span>
          <span className="font-semibold text-admin-heading">{item.branch_name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StarBadge rating={item.rating} />
          <SentimentTag sentiment={item.sentiment} />
        </div>
      </div>

      {item.categories?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-admin-body mb-1.5">{tf.customer_selected_categories}</div>
          <div className="flex flex-wrap gap-1.5">
            {item.categories.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-full bg-gray-100 text-admin-heading text-xs font-medium">
                {CATEGORY_LABELS[c] || c}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.comment && <p className="text-admin-heading text-sm leading-relaxed mb-3">{item.comment}</p>}

      {(item.customer_name || item.customer_phone || item.customer_email) && (
        <p className="text-admin-body text-xs mb-3">
          {tf.contact_details}: {[item.customer_name, item.customer_phone, item.customer_email].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <StatusTag status={item.status} />
          <select
            value={item.status}
            onChange={(e) => onStatusChange(item.id, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-admin-heading focus:outline-none focus:border-accent"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-admin-body" style={{ fontSize: 11 }}>
          <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
          <span>{tf.legal_disclaimer}</span>
        </div>
      </div>
    </div>
  );
}
