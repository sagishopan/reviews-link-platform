import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { restaurants as restaurantsApi, branches as branchesApi, users as usersApi, settingsApi } from '../adminApi.js';
import { formatNumber, sortByName } from '../formatters.js';
import { t, translateError } from '../../locales/index.js';

const ts = t.admin.settings;
const tc = t.common;

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="font-bold text-admin-heading text-lg">{title}</h2>
      {subtitle && <p className="text-admin-body text-sm mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent';

function BrandSection({ restaurant, canEdit, onSaved }) {
  const [form, setForm] = useState({
    name: restaurant.name,
    primary_color: restaurant.primary_color,
    accent_color: restaurant.accent_color,
    privacy_policy_url: restaurant.privacy_policy_url || '',
    default_rating_threshold: restaurant.default_rating_threshold,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { restaurant: updated } = await restaurantsApi.update(restaurant.id, form);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={ts.brand_section_title} subtitle={ts.brand_section_subtitle}>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-admin-body">{ts.restaurant_name_label}</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full mt-1 ${inputClass}`} />
        </div>
        <div>
          <label className="text-xs text-admin-body">{ts.default_threshold_label}</label>
          <select
            value={form.default_rating_threshold}
            onChange={(e) => setForm({ ...form, default_rating_threshold: Number(e.target.value) })}
            className={`w-full mt-1 ${inputClass}`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {formatNumber(n)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-admin-body">{ts.primary_color_label}</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200" />
            <input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className={`flex-1 ${inputClass}`} />
          </div>
        </div>
        <div>
          <label className="text-xs text-admin-body">{ts.accent_color_label}</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200" />
            <input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className={`flex-1 ${inputClass}`} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-admin-body">{ts.privacy_url_label}</label>
          <input
            value={form.privacy_policy_url}
            onChange={(e) => setForm({ ...form, privacy_policy_url: e.target.value })}
            placeholder="https://..."
            className={`w-full mt-1 ${inputClass}`}
          />
        </div>
        {canEdit && (
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--color-accent, #F97316)' }}>
              {saving ? tc.saving : tc.save}
            </button>
            {saved && <span className="text-green-600 text-sm">{tc.saved} ✓</span>}
          </div>
        )}
      </form>
    </Section>
  );
}

function BranchCopyAndNotifications({ branches, canEdit, onSaved }) {
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const branch = branches.find((b) => b.id === Number(branchId));
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (branch) {
      setForm({
        intro_text: branch.intro_text || '',
        question_text: branch.question_text || '',
        rating_threshold: branch.rating_threshold,
        manager_email: branch.manager_email || '',
        manager_phone: branch.manager_phone || '',
        manager_whatsapp: branch.manager_whatsapp || '',
        notify_email_enabled: !!branch.notify_email_enabled,
        notify_whatsapp_enabled: !!branch.notify_whatsapp_enabled,
        notify_webhook_enabled: !!branch.notify_webhook_enabled,
        notify_webhook_url: branch.notify_webhook_url || '',
      });
    }
  }, [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!branch || !form) return null;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { branch: updated } = await branchesApi.update(branch.id, form);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={ts.copy_section_title} subtitle={ts.copy_section_subtitle}>
      <div className="mb-4 flex items-end gap-2">
        <div className="flex-1">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        {branch?.review_url && (
          <button
            type="button"
            onClick={() => window.open(branch.review_url, '_blank')}
            className="px-3 py-2 rounded-lg text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--color-accent, #F97316)' }}
          >
            {ts.test_link}
          </button>
        )}
      </div>

      <form onSubmit={save} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-admin-body">{ts.intro_text_label}</label>
          <input value={form.intro_text} onChange={(e) => setForm({ ...form, intro_text: e.target.value })} className={`w-full mt-1 ${inputClass}`} />
        </div>
        <div>
          <label className="text-xs text-admin-body">{ts.question_text_label}</label>
          <input
            value={form.question_text}
            onChange={(e) => setForm({ ...form, question_text: e.target.value })}
            placeholder={ts.question_text_placeholder}
            className={`w-full mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs text-admin-body">{ts.threshold_label}</label>
          <select
            value={form.rating_threshold}
            onChange={(e) => setForm({ ...form, rating_threshold: Number(e.target.value) })}
            className={`mt-1 ${inputClass}`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {formatNumber(n)}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-admin-heading mb-3">{ts.notify_channels_title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.notify_email_enabled} onChange={(e) => setForm({ ...form, notify_email_enabled: e.target.checked })} />
              {ts.notify_email}
            </label>
            <input
              value={form.manager_email}
              onChange={(e) => setForm({ ...form, manager_email: e.target.value })}
              placeholder={ts.manager_email_placeholder}
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.notify_whatsapp_enabled} onChange={(e) => setForm({ ...form, notify_whatsapp_enabled: e.target.checked })} />
              {ts.notify_whatsapp}
            </label>
            <input
              value={form.manager_whatsapp}
              onChange={(e) => setForm({ ...form, manager_whatsapp: e.target.value })}
              placeholder={ts.manager_whatsapp_placeholder}
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.notify_webhook_enabled} onChange={(e) => setForm({ ...form, notify_webhook_enabled: e.target.checked })} />
              {ts.notify_webhook}
            </label>
            <input
              value={form.notify_webhook_url}
              onChange={(e) => setForm({ ...form, notify_webhook_url: e.target.value })}
              placeholder={ts.webhook_url_placeholder}
              className={inputClass}
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--color-accent, #F97316)' }}>
              {saving ? tc.saving : tc.save}
            </button>
            {saved && <span className="text-green-600 text-sm">{tc.saved} ✓</span>}
          </div>
        )}
      </form>
    </Section>
  );
}

function UsersSection({ restaurantId, branches, users, canManage, onChanged }) {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'branch_manager', branch_id: branches[0]?.id || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const roleLabel = {
    super_admin: ts.role_super_admin,
    restaurant_admin: ts.role_restaurant_admin,
    branch_manager: ts.role_branch_manager,
  };

  const createUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await usersApi.create({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        restaurant_id: restaurantId,
        branch_id: form.role === 'branch_manager' ? form.branch_id : undefined,
      });
      setForm({ email: '', password: '', name: '', role: 'branch_manager', branch_id: branches[0]?.id || '' });
      onChanged();
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={ts.users_section_title}>
      <div className="flex flex-col divide-y divide-gray-100 mb-4">
        {users.map((u) => (
          <div key={u.id} className="py-2.5 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-admin-heading">{u.name || u.email}</span>
              <span className="text-admin-body"> · {u.email}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-admin-heading">{roleLabel[u.role] || u.role}</span>
          </div>
        ))}
      </div>

      {canManage && (
        <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={ts.user_email_placeholder} className={inputClass} />
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={ts.user_password_placeholder}
            className={inputClass}
          />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={ts.user_name_placeholder} className={inputClass} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
            <option value="branch_manager">{ts.role_branch_manager}</option>
            <option value="restaurant_admin">{ts.role_restaurant_admin}</option>
          </select>
          {form.role === 'branch_manager' && (
            <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className={inputClass}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {error && <p className="text-red-600 text-xs sm:col-span-2">{error}</p>}
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl text-white font-semibold text-sm sm:col-span-2" style={{ backgroundColor: 'var(--color-accent, #F97316)' }}>
            {ts.add_user}
          </button>
        </form>
      )}
    </Section>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [restaurantId, setRestaurantId] = useState(user?.restaurant_id || '');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      restaurantsApi.list().then((r) => {
        const sorted = sortByName(r.restaurants);
        setRestaurantOptions(sorted);
        if (!restaurantId && sorted[0]) setRestaurantId(sorted[0].id);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async (id) => {
    if (!id) return;
    const r = await settingsApi.get(id);
    setData({ ...r, branches: sortByName(r.branches) });
  };

  useEffect(() => {
    loadSettings(restaurantId);
  }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!restaurantId || !data) {
    return <p className="text-admin-body">{ts.loading}</p>;
  }

  const canEdit = user?.role !== 'branch_manager';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-extrabold text-admin-heading" style={{ fontSize: 28 }}>
            {ts.title}
          </h1>
          <p className="text-admin-body mt-1">{ts.subtitle}</p>
        </div>
        {user?.role === 'super_admin' && restaurantOptions.length > 1 && (
          <select value={restaurantId} onChange={(e) => setRestaurantId(Number(e.target.value))} className={inputClass}>
            {restaurantOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <BrandSection restaurant={data.restaurant} canEdit={canEdit} onSaved={() => loadSettings(restaurantId)} />
      {data.branches.length > 0 && (
        <BranchCopyAndNotifications branches={data.branches} canEdit={canEdit} onSaved={() => loadSettings(restaurantId)} />
      )}
      <UsersSection
        restaurantId={restaurantId}
        branches={data.branches}
        users={data.users}
        canManage={user?.role === 'super_admin' || user?.role === 'restaurant_admin'}
        onChanged={() => loadSettings(restaurantId)}
      />
    </div>
  );
}
