import React from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export default function NotFoundScreen() {
  const { t } = useI18n();

  return (
    <Screen className="min-h-screen flex flex-col items-center justify-center bg-white px-8 text-center">
      <h1 className="font-extrabold text-heading" style={{ fontSize: 24 }}>
        {t.common.not_found_title}
      </h1>
      <p className="text-body mt-3 max-w-xs" style={{ fontSize: 16 }}>
        {t.common.not_found_body}
      </p>
    </Screen>
  );
}
