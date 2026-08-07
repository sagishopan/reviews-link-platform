const BASE = '/api/public';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getRestaurant(slug) {
  return request(`/restaurants/${encodeURIComponent(slug)}`);
}

export function getBranch(slug) {
  return request(`/branches/${encodeURIComponent(slug)}`);
}

export function submitRating(slug, rating, source, selectionMethod) {
  return request(`/branches/${encodeURIComponent(slug)}/ratings`, {
    method: 'POST',
    body: JSON.stringify({ rating, source, branch_selection_method: selectionMethod }),
  });
}

export function submitFeedback(responseId, payload) {
  return request(`/responses/${responseId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
