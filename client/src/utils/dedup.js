const KEY = 'rl_rated_branches';
const SOFT_BLOCK_MS = 12 * 60 * 60 * 1000; // 12 hours

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

// Soft, client-side-only duplicate guard: this is a courtesy to avoid asking
// the same browser to rate the same branch twice in a short window. It is not
// a security control - the server's IP-hash rate limit is the real backstop.
export function hasRecentlyRated(branchSlug) {
  const map = readMap();
  const ts = map[branchSlug];
  return typeof ts === 'number' && Date.now() - ts < SOFT_BLOCK_MS;
}

export function markRated(branchSlug) {
  const map = readMap();
  map[branchSlug] = Date.now();
  localStorage.setItem(KEY, JSON.stringify(map));
}
