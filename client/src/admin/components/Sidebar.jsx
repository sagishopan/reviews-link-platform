import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { t } from '../../locales/index.js';

const ts = t.admin.sidebar;

const NAV_ITEMS = [
  { to: '/admin', end: true, label: ts.dashboard, icon: IconDashboard },
  { to: '/admin/businesses', label: ts.businesses, icon: IconBuilding },
  { to: '/admin/feedback', label: ts.feedback, icon: IconChat },
  { to: '/admin/analytics', label: ts.analytics, icon: IconChart },
  { to: '/admin/settings', label: ts.settings, icon: IconGear },
];

function IconDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </svg>
  );
}
function IconChat(props) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
function IconGear(props) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <aside className="w-[260px] shrink-0 bg-sidebar text-white flex flex-col h-screen sticky top-0">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center font-extrabold shrink-0"
            style={{ background: 'linear-gradient(135deg, #E84C89, #FCD34D)' }}
          >
            {t.meta.brand_initials}
          </div>
          <div>
            <div className="font-bold leading-tight">{t.meta.brand_name}</div>
            <div className="text-xs text-gray-400 leading-tight">{t.meta.admin_tagline}</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium mb-3 px-2">{ts.nav_heading}</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors relative ${
                  isActive ? 'text-white' : 'text-gray-300 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => (isActive ? { backgroundColor: 'var(--color-accent, #F97316)' } : undefined)}
            >
              {({ isActive }) => (
                <>
                  <Icon />
                  <span>{label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white absolute left-3" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-5 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full py-2 rounded-lg border border-red-400/40 text-red-300 text-sm font-medium hover:bg-red-500/10 transition-colors"
        >
          {ts.logout}
        </button>
      </div>
    </aside>
  );
}
