// Accepts local Israeli format (0 + 8-9 digits, covers mobile 05X and
// landline 0X numbers) or international format (+972/972 + 8-9 digits).
export function isValidIsraeliPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^0\d{8,9}$/.test(cleaned) || /^(\+972|972)\d{8,9}$/.test(cleaned);
}
