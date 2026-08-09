import React from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export default function BranchPickerScreen({ restaurant, branches, onSelect }) {
  const { t } = useI18n();

  return (
    <Screen className="min-h-screen flex flex-col bg-white px-5 pt-10 pb-8">
      <div className="flex flex-col items-center text-center mb-8">
        {restaurant?.logo_url ? (
          <img src={restaurant.logo_url} alt={restaurant.name} className="h-16 w-16 rounded-md object-cover mb-4" />
        ) : (
          <div
            className="h-16 w-16 rounded-md mb-4 flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {restaurant?.name?.[0] || '?'}
          </div>
        )}
        <h1 className="font-extrabold text-heading" style={{ fontSize: 26 }}>
          {restaurant?.name}
        </h1>
        <h2 className="font-bold text-heading mt-4" style={{ fontSize: 22 }}>
          {t.picker.title}
        </h2>
        <p className="text-body mt-1" style={{ fontSize: 15 }}>
          {t.picker.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {branches.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(b)}
            className="w-full flex items-center justify-between rounded-md border border-gray-200 px-5 tap-target hover:bg-gray-50 active:scale-[0.99] transition"
            style={{ height: 64 }}
          >
            <span className="font-semibold text-heading" style={{ fontSize: 17 }}>
              {b.name}
            </span>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#6B7280" strokeWidth="2">
              <path d="M9 6l6 6-6 6" transform="rotate(180 12 12)" />
            </svg>
          </button>
        ))}
      </div>
    </Screen>
  );
}
