import React from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { isValidIsraeliPhone } from '../../utils/phone.js';

export default function ContactScreen({ contact, onChange, onFinish }) {
  const { t } = useI18n();
  const phoneValid = isValidIsraeliPhone(contact.phone);
  const needsContact = contact.consent && !phoneValid;

  const inputClass =
    'w-full rounded-md border border-gray-200 px-4 py-3 text-heading focus:outline-none focus:border-accent';

  return (
    <Screen className="min-h-screen flex flex-col bg-white px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)' }}>
      <h1 className="font-extrabold text-heading" style={{ fontSize: 28 }}>
        {t.contact.title}
      </h1>
      <p className="text-body mt-2 mb-6" style={{ fontSize: 15 }}>
        {t.contact.subtitle}
      </p>

      <div className="flex flex-col gap-4 flex-1">
        <input
          type="text"
          value={contact.name}
          onChange={(e) => onChange({ ...contact, name: e.target.value })}
          placeholder={t.contact.name}
          maxLength={120}
          className={inputClass}
          style={{ fontSize: 16, height: 52 }}
        />
        <input
          type="tel"
          value={contact.phone}
          onChange={(e) => onChange({ ...contact, phone: e.target.value })}
          placeholder={t.contact.phone}
          maxLength={20}
          className={inputClass}
          style={{ fontSize: 16, height: 52 }}
        />

        <label className="flex items-start gap-3 mt-1 tap-target cursor-pointer">
          <input
            type="checkbox"
            checked={contact.consent}
            onChange={(e) => onChange({ ...contact, consent: e.target.checked })}
            className="mt-1 h-5 w-5 accent-accent"
          />
          <span className="text-heading" style={{ fontSize: 15 }}>
            {t.contact.consent}
          </span>
        </label>

        <p className="text-body text-right" style={{ fontSize: 13, lineHeight: 1.5 }}>
          {t.contact.privacy_notice}{' '}
          <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">
            {t.contact.privacy_link_text}
          </a>
        </p>

        {needsContact && (
          <p className="text-accent" style={{ fontSize: 13 }}>
            {contact.phone ? t.contact.invalid_phone : t.contact.contact_required_hint}
          </p>
        )}
      </div>

      <div className="py-6">
        <button
          type="button"
          onClick={onFinish}
          disabled={needsContact}
          className="w-full font-bold text-white tap-target disabled:opacity-50"
          style={{ height: 58, borderRadius: 4, fontSize: 19, backgroundColor: 'var(--color-accent)' }}
        >
          {t.contact.finish}
        </button>
      </div>
    </Screen>
  );
}
