import React from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export default function DetailsScreen({ comment, onChange, onContinue }) {
  const { t } = useI18n();

  return (
    <Screen className="min-h-screen flex flex-col bg-white px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)' }}>
      <h1 className="font-extrabold text-heading" style={{ fontSize: 28 }}>
        {t.details.title}
      </h1>
      <p className="text-body mt-2 mb-6" style={{ fontSize: 15 }}>
        {t.details.subtitle}
      </p>

      <textarea
        value={comment}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.details.placeholder}
        rows={8}
        maxLength={2000}
        className="flex-1 w-full rounded-md border border-gray-200 p-4 text-heading resize-none focus:outline-none focus:border-accent"
        style={{ fontSize: 16, minHeight: 180 }}
      />

      <div className="py-6">
        <button
          type="button"
          onClick={onContinue}
          className="w-full font-bold text-white tap-target"
          style={{ height: 58, borderRadius: 4, fontSize: 19, backgroundColor: 'var(--color-accent)' }}
        >
          {t.details.continue}
        </button>
      </div>
    </Screen>
  );
}
