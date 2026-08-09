import React, { useCallback, useEffect, useState } from 'react';
import { responses as responsesApi, branches as branchesApi, exportApi, getToken } from '../adminApi.js';
import FeedbackCard from '../components/FeedbackCard.jsx';
import { CATEGORY_LABELS } from '../categoryLabels.js';
import { formatNumber, sortByName } from '../formatters.js';
import { t } from '../../locales/index.js';

const tf = t.admin.feedback;
const tc = t.common;

const DATE_RANGES = {
  all: null,
  today: 1,
  '7d': 7,
  '30d': 30,
};

function dateFromDays(days) {
  if (!days) return null;
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function SummaryTile({ color, value, label, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="font-extrabold" style={{ fontSize: 26 }}>
          {formatNumber(value)}
        </span>
      </div>
      <div className="text-admin-body text-xs">{label}</div>
    </div>
  );
}

export default function FeedbackPage() {
  const [branchOptions, setBranchOptions] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    branch_id: '',
    rating: '',
    sentiment: '',
    category: '',
    range: 'all',
    sort: 'newest',
  });
  const [result, setResult] = useState({ responses: [], total: 0, summary: { avg_rating: 0, positive_count: 0, negative_count: 0, pending_count: 0 } });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    branchesApi.list().then((r) => setBranchOptions(sortByName(r.branches)));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20, sort: filters.sort };
      if (filters.q) params.q = filters.q;
      if (filters.branch_id) params.branch_id = filters.branch_id;
      if (filters.rating) params.rating = filters.rating;
      if (filters.sentiment) params.sentiment = filters.sentiment;
      if (filters.category) params.category = filters.category;
      const days = DATE_RANGES[filters.range];
      if (days) params.date_from = dateFromDays(days);

      const r = await responsesApi.list(params);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAll = () => {
    setPage(1);
    setFilters({ q: '', branch_id: '', rating: '', sentiment: '', category: '', range: 'all', sort: 'newest' });
  };

  const handleStatusChange = async (id, status) => {
    await responsesApi.update(id, { status });
    setResult((prev) => ({ ...prev, responses: prev.responses.map((r) => (r.id === id ? { ...r, status } : r)) }));
  };

  const selectClass = 'text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-admin-heading bg-white focus:outline-none focus:border-accent';

  const handleExport = async () => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.branch_id) params.branch_id = filters.branch_id;
    if (filters.rating) params.rating = filters.rating;
    if (filters.sentiment) params.sentiment = filters.sentiment;
    if (filters.category) params.category = filters.category;
    const days = DATE_RANGES[filters.range];
    if (days) params.date_from = dateFromDays(days);

    // A plain <a href> can't carry the Bearer auth header the export route
    // requires, so fetch it manually and trigger the download from a blob.
    const res = await fetch(exportApi.responsesCsvUrl(params), {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback-export-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-extrabold text-admin-heading" style={{ fontSize: 28 }}>
          {tf.title}
        </h1>
        <p className="text-admin-body mt-1">{tf.subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 font-bold text-admin-heading">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          {tf.filter_heading}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#9CA3AF" strokeWidth="2" className="absolute top-1/2 -translate-y-1/2 right-3">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder={tf.search_placeholder}
              className="w-full text-sm border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-accent"
            />
          </div>
          <select value={filters.branch_id} onChange={(e) => updateFilter('branch_id', e.target.value)} className={selectClass}>
            <option value="">
              {tf.all_businesses} ({formatNumber(branchOptions.length)})
            </option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select value={filters.rating} onChange={(e) => updateFilter('rating', e.target.value)} className={selectClass}>
            <option value="">{tf.all_ratings}</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {formatNumber(n)} {tf.stars_suffix}
              </option>
            ))}
          </select>
          <select value={filters.sentiment} onChange={(e) => updateFilter('sentiment', e.target.value)} className={selectClass}>
            <option value="">{tf.all_sentiments}</option>
            <option value="positive">{t.admin.sentiment.positive}</option>
            <option value="neutral">{t.admin.sentiment.neutral}</option>
            <option value="negative">{t.admin.sentiment.negative}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className={selectClass}>
            <option value="">{tf.all_categories}</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select value={filters.range} onChange={(e) => updateFilter('range', e.target.value)} className={selectClass}>
            <option value="all">{tf.all_time}</option>
            <option value="today">{tf.today}</option>
            <option value="7d">{tf.last_7_days}</option>
            <option value="30d">{tf.last_30_days}</option>
          </select>
          <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className={selectClass}>
            <option value="newest">{tf.sort_newest}</option>
            <option value="oldest">{tf.sort_oldest}</option>
            <option value="rating_high">{tf.sort_rating_high}</option>
            <option value="rating_low">{tf.sort_rating_low}</option>
          </select>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold rounded-xl px-3 py-2.5 border-2"
            style={{ borderColor: 'var(--color-accent, #F97316)', color: 'var(--color-accent, #F97316)' }}
          >
            {tf.clear_all}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <SummaryTile
          color="#E84C89"
          value={result.summary.avg_rating}
          label={tf.tile_avg_rating}
          icon={
            <svg viewBox="0 0 24 24" width={18} height={18} fill="#E84C89">
              <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.8l7.1-.7L12 2.5z" />
            </svg>
          }
        />
        <SummaryTile color="#16A34A" value={result.summary.positive_count} label={tf.tile_positive} icon={<span>😊</span>} />
        <SummaryTile color="#DC2626" value={result.summary.negative_count} label={tf.tile_negative} icon={<span>😞</span>} />
        <SummaryTile color="#EA580C" value={result.summary.pending_count} label={tf.tile_unhandled} icon={<span>⏳</span>} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-admin-body text-sm">
          {formatNumber(result.total)} {tf.results_suffix}
        </span>
        <button type="button" onClick={handleExport} className="text-sm font-semibold" style={{ color: 'var(--color-accent, #F97316)' }}>
          {tf.export_csv}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {result.responses.map((item) => (
          <FeedbackCard key={item.id} item={item} onStatusChange={handleStatusChange} />
        ))}
        {!loading && result.responses.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-admin-body">{tf.empty}</div>
        )}
      </div>

      {result.total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
          >
            {tc.previous}
          </button>
          <span className="text-sm text-admin-body">
            {tc.page} {formatNumber(page)}
          </span>
          <button
            type="button"
            disabled={page * 20 >= result.total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
          >
            {tc.next}
          </button>
        </div>
      )}
    </div>
  );
}
