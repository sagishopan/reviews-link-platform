import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-3 px-1 cursor-pointer select-none">
      <span className="text-[15px] text-heading font-medium">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-gray-300'}`}
      >
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? '-translate-x-1' : '-translate-x-6'}`}
          style={{ transform: checked ? 'translateX(-1.25rem)' : 'translateX(-0.125rem)' }}
        />
      </span>
    </label>
  );
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const { settings, toggle } = useAccessibility();
  const { t } = useI18n();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.accessibility.open}
        className="fixed bottom-4 left-4 z-40 flex items-center justify-center rounded-full shadow-lg tap-target"
        style={{ width: 56, height: 56, backgroundColor: 'var(--color-primary)' }}
      >
        <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4" r="1.6" fill="white" stroke="none" />
          <path d="M4 8.5c2.5 1 5.3 1.5 8 1.5s5.5-.5 8-1.5" />
          <path d="M12 10v11" />
          <path d="M8 14l-2 7" />
          <path d="M16 14l2 7" />
          <path d="M9 13.5l3 1.2 3-1.2" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t.accessibility.title}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-heading">{t.accessibility.title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.accessibility.close} className="tap-target text-body">
                ✕
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              <ToggleRow label={t.accessibility.large_text} checked={settings.largeText} onChange={() => toggle('largeText')} />
              <ToggleRow label={t.accessibility.high_contrast} checked={settings.highContrast} onChange={() => toggle('highContrast')} />
              <ToggleRow label={t.accessibility.underline_links} checked={settings.underlineLinks} onChange={() => toggle('underlineLinks')} />
              <ToggleRow label={t.accessibility.stop_animations} checked={settings.reduceMotion} onChange={() => toggle('reduceMotion')} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
