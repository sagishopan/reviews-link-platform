import React, { createContext, useContext } from 'react';
import { t } from '../locales/index.js';

const I18nContext = createContext({ t });

export function I18nProvider({ children }) {
  return <I18nContext.Provider value={{ t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
