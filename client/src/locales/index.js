import he from './he.json';

export const t = he;

// Server-side API error messages are English identifiers by design (translation
// happens only in the display layer, per the localization spec) - this maps
// them to the Hebrew text shown to the user, with a generic fallback for any
// message not explicitly mapped.
export function translateError(message) {
  return t.admin.errors[message] || t.admin.errors.generic;
}
