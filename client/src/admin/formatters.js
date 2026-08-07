function pad(n) {
  return String(n).padStart(2, '0');
}

// DD/MM/YYYY, 24-hour time - he-IL's built-in toLocaleDateString uses dots
// (DD.MM.YYYY), so this formats explicitly to match the required convention.
export function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatShortDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('he-IL');
}

const collator = new Intl.Collator('he');
export function sortByName(list, key = 'name') {
  return [...list].sort((a, b) => collator.compare(a[key], b[key]));
}
