import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AccessibilityContext = createContext(null);

const DEFAULTS = {
  largeText: false,
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
};

function loadStored() {
  try {
    const raw = localStorage.getItem('rl_a11y');
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

const CLASS_MAP = {
  largeText: 'a11y-large-text',
  highContrast: 'a11y-high-contrast',
  underlineLinks: 'a11y-underline-links',
  reduceMotion: 'a11y-reduce-motion',
};

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(loadStored);

  useEffect(() => {
    localStorage.setItem('rl_a11y', JSON.stringify(settings));
    const root = document.documentElement;
    Object.entries(CLASS_MAP).forEach(([key, className]) => {
      root.classList.toggle(className, !!settings[key]);
    });
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      toggle: (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] })),
    }),
    [settings]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
