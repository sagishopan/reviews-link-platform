import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { restaurants as restaurantsApi, branches as branchesApi, qrcodes, getToken } from '../adminApi.js';
import { formatNumber, sortByName } from '../formatters.js';
import { t, translateError } from '../../locales/index.js';

const tb = t.admin.businesses;

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function NewRestaurantForm({ onCreated }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { restaurant } = await restaurantsApi.create({ name, slug: slug || slugify(name) });
      setName('');
      setSlug('');
      onCreated(restaurant);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row gap-3 items-end">
      <div className="flex-1 w-full">
        <label className="text-xs text-admin-body">{tb.restaurant_name_label}</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 w-full">
        <label className="text-xs text-admin-body">{tb.restaurant_slug_label}</label>
        <input
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder={name ? slugify(name) : 'my-restaurant'}
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shrink-0"
        style={{ backgroundColor: 'var(--color-accent, #F97316)' }}
      >
        {tb.add_business}
      </button>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </form>
  );
}

function NewBranchForm({ restaurantId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');
  const [threshold, setThreshold] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold" style={{ color: 'var(--color-accent, #F97316)' }}>
        {tb.add_branch}
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { branch } = await branchesApi.create({
        restaurant_id: restaurantId,
        name,
        slug: slug || slugify(name),
        review_url: reviewUrl,
        rating_threshold: Number(threshold),
      });
      setName('');
      setSlug('');
      setReviewUrl('');
      setOpen(false);
      onCreated(branch);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tb.branch_name_placeholder}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder={name ? slugify(name) : 'my-branch'}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={reviewUrl}
          onChange={(e) => setReviewUrl(e.target.value)}
          placeholder={tb.review_url_placeholder}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-admin-body whitespace-nowrap">{tb.threshold_label}</label>
          <select value={threshold} onChange={(e) => setThreshold(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {formatNumber(n)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: 'var(--color-accent, #F97316)' }}>
          {t.common.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm text-admin-body">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

function QrGenerator({ restaurant }) {
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await qrcodes.restaurant(restaurant.id, source || undefined);
      setPreview(r);
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const url = qrcodes.restaurantDownloadUrl(restaurant.id, source || undefined, 1200);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objUrl;
    link.download = `qr-${restaurant.slug}${source ? `-${source}` : ''}.png`;
    link.click();
    URL.revokeObjectURL(objUrl);
  };

  if (!restaurant.slug) {
    return <p className="text-admin-body text-sm">{tb.qr_no_slug}</p>;
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
        <div className="flex-1 w-full">
          <label className="text-xs text-admin-body">{tb.qr_source_label}</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={tb.qr_source_placeholder}
            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button type="button" onClick={generate} disabled={busy} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: 'var(--color-primary, #4A6CF7)' }}>
          {busy ? t.common.loading : tb.qr_show}
        </button>
      </div>

      {preview && (
        <div className="flex items-center gap-4">
          <img src={preview.qr_data_url} alt={tb.qr_alt} className="w-32 h-32 rounded-lg border border-gray-200" />
          <div className="flex flex-col gap-2">
            <p className="text-xs text-admin-body break-all">{preview.url}</p>
            <button type="button" onClick={download} className="text-sm font-semibold self-start" style={{ color: 'var(--color-accent, #F97316)' }}>
              {tb.qr_download}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BranchRow({ branch }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0 flex-wrap">
      <div className="min-w-0">
        <div className="font-medium text-admin-heading text-sm flex items-center gap-2">
          {branch.name}
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: branch.is_active ? '#DCFCE7' : '#F3F4F6', color: branch.is_active ? '#166534' : '#6B7280' }}
          >
            {branch.is_active ? tb.active : tb.inactive}
          </span>
        </div>
        <div className="text-xs text-admin-body mt-0.5">
          /r/{branch.slug} · {tb.threshold_label} {formatNumber(branch.rating_threshold)}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-admin-body shrink-0">
        <span>
          {formatNumber(branch.feedback_count)} {tb.feedback_count_suffix}
        </span>
        <span>
          {tb.avg_prefix} {formatNumber(branch.avg_rating)}
        </span>
      </div>
    </div>
  );
}

export default function BusinessesPage() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await restaurantsApi.list();
    setList(sortByName(r.restaurants));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const [branchesByRestaurant, setBranchesByRestaurant] = useState({});

  const toggleExpand = async (restaurantId) => {
    if (expanded === restaurantId) {
      setExpanded(null);
      return;
    }
    setExpanded(restaurantId);
    if (!branchesByRestaurant[restaurantId]) {
      const r = await branchesApi.list(restaurantId);
      setBranchesByRestaurant((prev) => ({ ...prev, [restaurantId]: sortByName(r.branches) }));
    }
  };

  const handleBranchCreated = (restaurantId, branch) => {
    setBranchesByRestaurant((prev) => ({ ...prev, [restaurantId]: sortByName([...(prev[restaurantId] || []), branch]) }));
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-extrabold text-admin-heading" style={{ fontSize: 28 }}>
          {tb.title}
        </h1>
        <p className="text-admin-body mt-1">{tb.subtitle}</p>
      </div>

      {user?.role === 'super_admin' && <NewRestaurantForm onCreated={() => load()} />}

      {loading && <p className="text-admin-body">{tb.loading}</p>}

      <div className="flex flex-col gap-4">
        {list.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleExpand(r.id)} className="w-full flex items-center justify-between p-5 text-right">
              <div>
                <h3 className="font-bold text-admin-heading">{r.name}</h3>
                <p className="text-xs text-admin-body mt-0.5">
                  {formatNumber(r.branch_count)} {tb.branches_heading} · {formatNumber(r.feedback_count)} {tb.feedback_count_suffix} ·{' '}
                  {tb.avg_prefix} {formatNumber(r.avg_rating)}
                </p>
              </div>
              <span className="text-admin-body">{expanded === r.id ? '−' : '+'}</span>
            </button>

            {expanded === r.id && (
              <div className="border-t border-gray-100 p-5 flex flex-col gap-5">
                <div>
                  <h4 className="font-semibold text-admin-heading text-sm mb-2">{tb.branches_heading}</h4>
                  {(branchesByRestaurant[r.id] || []).map((b) => (
                    <BranchRow key={b.id} branch={b} />
                  ))}
                  <div className="mt-3">
                    <NewBranchForm restaurantId={r.id} onCreated={(b) => handleBranchCreated(r.id, b)} />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-admin-heading text-sm mb-2">{tb.qr_title}</h4>
                  <QrGenerator restaurant={r} />
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && list.length === 0 && <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-admin-body">{tb.empty}</div>}
      </div>
    </div>
  );
}
