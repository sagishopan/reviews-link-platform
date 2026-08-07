import React from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export default function ThankYouScreen({ hasContact }) {
  const { t } = useI18n();

  return (
    <Screen className="min-h-screen flex flex-col items-center justify-center bg-white px-8 text-center">
      <div
        className="flex items-center justify-center rounded-full mb-6"
        style={{ width: 88, height: 88, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
      >
        <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="font-extrabold text-heading" style={{ fontSize: 26 }}>
        {t.thankyou.title}
      </h1>
      <p className="text-body mt-3 max-w-xs" style={{ fontSize: 16 }}>
        {hasContact ? t.thankyou.body_with_contact : t.thankyou.body_no_contact}
      </p>
    </Screen>
  );
}
