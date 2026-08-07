// Lightens a hex color by mixing it toward white - used to derive the second
// gradient stop from a single admin-configured primary color.
export function lighten(hex, amount = 0.15) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  const toHex = (channel) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function applyBrandColors({ primary_color: primary, accent_color: accent }) {
  const root = document.documentElement;
  if (primary) {
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-end', lighten(primary, 0.12));
  }
  if (accent) {
    root.style.setProperty('--color-accent', accent);
  }
}
