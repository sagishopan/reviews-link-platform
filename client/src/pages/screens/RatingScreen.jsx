import React from 'react';
import Screen from '../../components/Screen.jsx';
import Stars from '../../components/Stars.jsx';
import InfoModal from '../../components/InfoModal.jsx';
import PrivacyStrip from '../../components/PrivacyStrip.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export default function RatingScreen({ branch, rating, onSelect, redirecting, alreadyRated }) {
  const { t } = useI18n();
  const label = rating ? t.rating.labels[rating] : null;

  return (
    <Screen className="min-h-screen flex flex-col bg-white">
      <header
        className="relative flex flex-col items-center justify-center text-center px-6 pb-14"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-end))',
          minHeight: '30vh',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
        }}
      >
        <InfoModal title={t.rating.info_title} body={t.rating.info_body} />
        <h1 className="font-extrabold text-white" style={{ fontSize: 34, lineHeight: 1.2 }}>
          {branch?.name}
        </h1>
        <p className="text-white mt-2" style={{ fontSize: 17, opacity: 0.85 }}>
          {branch?.intro_text || branch?.restaurant_name}
        </p>
      </header>

      <main
        className="flex-1 bg-white flex flex-col items-center px-6 pb-8"
        style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        <h2 className="font-extrabold text-heading text-center" style={{ fontSize: 30, marginTop: 40 }}>
          {branch?.question_text || t.rating.question}
        </h2>

        <div className="mt-10">
          {alreadyRated ? (
            <p className="text-body text-center max-w-xs" style={{ fontSize: 16 }}>
              {t.rating.already_rated}
            </p>
          ) : (
            <Stars rating={rating} onSelect={onSelect} labels={t.rating.labels} />
          )}
        </div>

        <div className="mt-6 min-h-[32px] flex flex-col items-center gap-3">
          {label && (
            <p className="font-extrabold text-accent" style={{ fontSize: 22 }}>
              {label}
            </p>
          )}
          {redirecting && (
            <div className="flex items-center gap-2 text-accent font-semibold" style={{ fontSize: 15 }}>
              <span
                className="spin"
                style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent' }}
              />
              {t.rating.redirecting}
            </div>
          )}
        </div>
      </main>

      <PrivacyStrip />
    </Screen>
  );
}
