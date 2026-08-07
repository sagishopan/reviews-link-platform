import React from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function PrivacyStrip({ policyUrl }) {
  const { t } = useI18n();

  return (
    <div className="w-full py-3 px-4 flex items-center justify-center gap-2 text-center" style={{ backgroundColor: '#3C4451' }}>
      <p className="text-white" style={{ fontSize: 13 }}>
        {t.rating.privacy_strip}
        {policyUrl && (
          <>
            {' · '}
            <a href={policyUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
              {t.rating.privacy_link}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
