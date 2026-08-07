import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { restaurants as restaurantsApi, responses as responsesApi, analytics } from '../adminApi.js';
import { StarBadge, SentimentTag, StatusTag } from '../components/Badges.jsx';
import LineChart from '../components/LineChart.jsx';
import { formatDateTime, formatNumber } from '../formatters.js';
import { t } from '../../locales/index.js';

const td = t.admin.dashboard;

function MetricCard({ gradient, value, label }) {
  return (
    <div className="rounded-2xl p-5 text-white flex-1 min-w-[160px]" style={{ background: gradient }}>
      <div className="font-extrabold" style={{ fontSize: 34 }}>
        {value}
      </div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businessCount, setBusinessCount] = useState(0);
  const [weekFeedback, setWeekFeedback] = useState(0);
  const [needsAttention, setNeedsAttention] = useState(0);
  const [trend, setTrend] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [restaurantsRes, trendRes, attentionRes, recentRes] = await Promise.all([
          restaurantsApi.list(),
          analytics.trend({ days: 14 }),
          responsesApi.list({ status: 'pending', sentiment: 'negative', page_size: 1 }),
          responsesApi.list({ sort: 'newest', page_size: 5 }),
        ]);
        if (cancelled) return;
        setBusinessCount(restaurantsRes.restaurants.length);
        setTrend(trendRes);
        setNeedsAttention(attentionRes.total);
        setRecent(recentRes.responses);

        const weekTrend = await analytics.trend({ days: 7 });
        if (!cancelled) setWeekFeedback(weekTrend.total_feedback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeUp = trend?.change_pct >= 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-xs font-bold text-admin-body shadow-sm mb-3">
          {td.badge}
        </span>
        <h1 className="font-extrabold text-admin-heading" style={{ fontSize: 40 }}>
          {td.greeting}, <span style={{ color: 'var(--color-primary, #4A6CF7)' }}>{user?.name || user?.email}</span> {td.wave}
        </h1>
        <p className="text-admin-body mt-1">{td.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <MetricCard gradient="linear-gradient(135deg, #4A6CF7, #6366F1)" value={loading ? '-' : formatNumber(businessCount)} label={td.total_businesses} />
        <MetricCard gradient="linear-gradient(135deg, #22C55E, #16A34A)" value={loading ? '-' : formatNumber(weekFeedback)} label={td.week_feedback} />
        <MetricCard gradient="linear-gradient(135deg, #F97316, #EA580C)" value={loading ? '-' : formatNumber(needsAttention)} label={td.needs_attention} />
      </div>

      <Link
        to="/admin/businesses"
        className="w-full py-4 rounded-2xl text-white font-bold text-center flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #4A6CF7, #7C3AED)' }}
      >
        <span>+</span> {td.add_business}
      </Link>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div style={{ height: 4, background: 'linear-gradient(90deg, #4A6CF7, #EC4899)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-bold text-admin-heading text-lg">{td.trend_title}</h2>
              <p className="text-admin-body text-sm">{td.trend_subtitle}</p>
            </div>
            {trend && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: changeUp ? '#DCFCE7' : '#FCE7F3',
                  color: changeUp ? '#166534' : '#9D174D',
                }}
              >
                {changeUp ? '↑' : '↓'} {formatNumber(Math.abs(trend.change_pct))}%
              </span>
            )}
          </div>

          <div className="flex gap-8 mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" width={20} height={20} fill="#F59E0B">
                  <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.8l7.1-.7L12 2.5z" />
                </svg>
                <span className="font-extrabold" style={{ fontSize: 32, color: 'var(--color-primary, #4A6CF7)' }}>
                  {trend ? formatNumber(trend.avg_rating) : '-'}
                </span>
              </div>
              <div className="text-admin-body text-xs mt-1">{td.avg_rating}</div>
            </div>
            <div>
              <span className="font-extrabold text-admin-heading" style={{ fontSize: 32 }}>
                {trend ? formatNumber(trend.total_feedback) : '-'}
              </span>
              <div className="text-admin-body text-xs mt-1">{td.total_feedback}</div>
            </div>
          </div>

          {trend && <LineChart data={trend.days} />}

          <div className="flex items-center gap-6 mt-3 text-xs text-admin-body">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#4A6CF7' }} /> {td.chart_legend_avg}
            </span>
            <span className="flex items-center gap-1.5">{td.chart_legend_hint}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-admin-heading text-lg">{td.recent_feedback}</h2>
          <Link to="/admin/feedback" className="text-sm font-semibold" style={{ color: 'var(--color-accent, #F97316)' }}>
            {td.view_all}
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {recent.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-admin-heading text-sm truncate">{r.branch_name}</div>
                <div className="text-xs text-admin-body mt-0.5">{formatDateTime(r.created_at)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StarBadge rating={r.rating} />
                <SentimentTag sentiment={r.sentiment} />
                <StatusTag status={r.status} />
              </div>
            </div>
          ))}
          {!loading && recent.length === 0 && <p className="text-admin-body text-sm py-4 text-center">{td.empty_feedback}</p>}
        </div>
      </div>
    </div>
  );
}
