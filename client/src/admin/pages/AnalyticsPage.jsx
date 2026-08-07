import React, { useEffect, useMemo, useState } from 'react';
import { branches as branchesApi, analytics } from '../adminApi.js';
import DonutChart from '../components/DonutChart.jsx';
import Heatmap from '../components/Heatmap.jsx';
import { formatNumber, sortByName } from '../formatters.js';
import { t } from '../../locales/index.js';

const ta = t.admin.analytics;

const SEGMENT_DEFS = [
  { key: 'positive', label: ta.satisfied, emoji: '😊', color: '#22C55E' },
  { key: 'neutral', label: ta.neutral, emoji: '😐', color: '#EAB308' },
  { key: 'negative', label: ta.dissatisfied, emoji: '😞', color: '#EF4444' },
];

export default function AnalyticsPage() {
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    branchesApi.list().then((r) => setBranchOptions(sortByName(r.branches)));
  }, []);

  const summaryBranchId = branchId || branchOptions[0]?.id;

  useEffect(() => {
    const params = branchId ? { branch_id: branchId } : {};
    analytics.sentiment(params).then(setSentiment);
    analytics.heatmap(params).then(setHeatmap);
  }, [branchId]);

  useEffect(() => {
    if (!summaryBranchId) return;
    setSummaryLoading(true);
    analytics
      .weeklySummary({ branch_id: summaryBranchId })
      .then((r) => setSummary(r.summary))
      .finally(() => setSummaryLoading(false));
  }, [summaryBranchId]);

  const refreshSummary = () => {
    if (!summaryBranchId) return;
    setSummaryLoading(true);
    analytics
      .weeklySummary({ branch_id: summaryBranchId, refresh: 'true' })
      .then((r) => setSummary(r.summary))
      .finally(() => setSummaryLoading(false));
  };

  const segments = useMemo(
    () =>
      SEGMENT_DEFS.map((s) => ({
        ...s,
        value: sentiment?.breakdown[s.key] || 0,
        pct: sentiment?.percentages[s.key] || 0,
        dimmed: activeSegment && activeSegment !== s.key,
      })),
    [sentiment, activeSegment]
  );

  const activeLabel = activeSegment ? SEGMENT_DEFS.find((s) => s.key === activeSegment)?.label : null;
  const summaryBranchName = branchOptions.find((b) => b.id === Number(summaryBranchId))?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-extrabold text-admin-heading" style={{ fontSize: 28 }}>
            {ta.title}
          </h1>
          <p className="text-admin-body mt-1">{ta.subtitle}</p>
        </div>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white"
        >
          <option value="">{ta.all_branches}</option>
          {branchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-admin-heading text-lg mb-1">{ta.sentiment_title}</h2>
        <p className="text-admin-body text-sm mb-5">{activeLabel ? `${ta.showing_filter}: ${activeLabel}` : ta.sentiment_hint}</p>

        <div className="flex flex-col items-center gap-5">
          <DonutChart segments={segments} total={sentiment?.total || 0} centerLabel={ta.total_feedback_center} />
          <div className="flex gap-3 flex-wrap justify-center">
            {segments.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSegment((prev) => (prev === s.key ? null : s.key))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
                style={{
                  borderColor: activeSegment === s.key ? s.color : '#E5E7EB',
                  backgroundColor: activeSegment === s.key ? `${s.color}15` : 'white',
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>
                  {s.emoji} {s.label}
                </span>
                <span className="text-admin-body">{formatNumber(s.pct)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <div>
              <h2 className="font-bold text-admin-heading text-lg">{ta.heatmap_title}</h2>
              <p className="text-admin-body text-sm">{ta.heatmap_subtitle}</p>
            </div>
          </div>
          {heatmap && (
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-bold text-admin-heading">
                {formatNumber(heatmap.total_complaints)} {ta.complaints_suffix}
              </span>
            </div>
          )}
        </div>

        {heatmap && (
          <>
            <div className="flex gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 flex-1">
                <div className="text-admin-body text-xs">{ta.busiest_day}</div>
                <div className="font-bold text-admin-heading">{heatmap.busiest_day || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex-1">
                <div className="text-admin-body text-xs">{ta.peak_hour}</div>
                <div className="font-bold text-admin-heading">{heatmap.peak_hour || '-'}</div>
              </div>
            </div>

            <Heatmap grid={heatmap.grid} max={heatmap.max} weekdayLabels={heatmap.weekday_labels} hours={heatmap.hours} />

            <div className="flex items-center justify-end gap-2 mt-3 text-xs text-admin-body">
              <span>{ta.less}</span>
              <span className="flex gap-0.5">
                {['#DCFCE7', '#FDE047', '#FB923C', '#EF4444'].map((c) => (
                  <span key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                ))}
              </span>
              <span>{ta.more}</span>
            </div>

            {heatmap.busiest_day && (
              <div className="mt-4 p-3 rounded-xl bg-blue-50 text-sm text-admin-heading flex items-start gap-2">
                <span>💡</span>
                <span>
                  {ta.insight_prefix} {heatmap.busiest_day} {ta.insight_middle} {heatmap.peak_hour}, {ta.insight_suffix}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <h2 className="font-bold text-admin-heading text-lg">{ta.weekly_summary_title}</h2>
            {summaryBranchName && <span className="text-admin-body text-sm">— {summaryBranchName}</span>}
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-bold">
                {formatNumber(summary.feedback_count)} {ta.feedback_count_suffix}
              </span>
            )}
            <button
              type="button"
              onClick={refreshSummary}
              disabled={summaryLoading}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-50"
              aria-label={ta.refresh}
            >
              ↻
            </button>
          </div>
        </div>

        {summaryLoading && <p className="text-admin-body text-sm">{ta.weekly_summary_refreshing}</p>}
        {!summaryLoading && summary && (
          <ul className="flex flex-col gap-2">
            {summary.insights.map((insight, i) => (
              <li key={i} className="text-sm text-admin-heading flex items-start gap-2">
                <span>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
        {!summaryLoading && !summary && <p className="text-admin-body text-sm">{ta.weekly_summary_empty}</p>}
      </div>
    </div>
  );
}
