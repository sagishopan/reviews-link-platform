import React from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

const CATEGORY_EMOJI = {
  food_quality: '🍽️',
  poor_service: '👥',
  long_wait: '🕐',
  low_quality: '✨',
  high_price: '💲',
  cleanliness: '🧹',
  atmosphere: '☕',
  limited_variety: '🛍️',
  unprofessional_staff: '👤',
  other: '😞',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_EMOJI);

export default function CategoriesScreen({ selected, onToggle, onContinue, onSkipAll }) {
  const { t } = useI18n();
  const hasSelection = selected.length > 0;

  return (
    <Screen className="min-h-screen flex flex-col bg-white px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)' }}>
      <h1 className="font-extrabold text-heading" style={{ fontSize: 28 }}>
        {t.categories.title}
      </h1>
      <p className="text-body mt-2" style={{ fontSize: 15 }}>
        {t.categories.subtitle}
      </p>

      <div className="border-t border-gray-200 mt-5 mb-5" />

      <div className="grid grid-cols-2 gap-3.5 flex-1">
        {CATEGORY_ORDER.map((key) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={isSelected}
              className="flex flex-col items-center justify-center rounded-2xl border transition-colors tap-target"
              style={{
                height: 108,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? 'var(--color-accent)' : '#E5E7EB',
                backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.05)' : '#FFFFFF',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
              }}
            >
              <span style={{ fontSize: 34 }}>{CATEGORY_EMOJI[key]}</span>
              <span className="font-medium text-heading text-center mt-2 px-1" style={{ fontSize: 16 }}>
                {t.categories.items[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="py-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="w-full font-bold text-white tap-target"
          style={{ height: 58, borderRadius: 12, fontSize: 19, backgroundColor: 'var(--color-accent)' }}
        >
          {hasSelection ? t.categories.continue : t.categories.continue_empty}
        </button>
        <button type="button" onClick={onSkipAll} className="text-body tap-target" style={{ fontSize: 16 }}>
          {t.categories.skip_all}
        </button>
      </div>
    </Screen>
  );
}
