const TOKEN_KEY = 'rl_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    throw new ApiError((isJson && data.error) || 'Request failed', res.status);
  }
  return data;
}

function get(path) {
  return request(path, { method: 'GET' });
}
function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}
function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}
function del(path) {
  return request(path, { method: 'DELETE' });
}

export const auth = {
  login: (email, password) => post('/api/auth/login', { email, password }),
  me: () => get('/api/auth/me'),
};

export const restaurants = {
  list: () => get('/api/admin/restaurants'),
  get: (id) => get(`/api/admin/restaurants/${id}`),
  create: (body) => post('/api/admin/restaurants', body),
  update: (id, body) => put(`/api/admin/restaurants/${id}`, body),
  remove: (id) => del(`/api/admin/restaurants/${id}`),
};

export const branches = {
  list: (restaurantId) => get(`/api/admin/branches${restaurantId ? `?restaurant_id=${restaurantId}` : ''}`),
  get: (id) => get(`/api/admin/branches/${id}`),
  create: (body) => post('/api/admin/branches', body),
  update: (id, body) => put(`/api/admin/branches/${id}`, body),
  remove: (id) => del(`/api/admin/branches/${id}`),
};

export const users = {
  list: () => get('/api/admin/users'),
  create: (body) => post('/api/admin/users', body),
  update: (id, body) => put(`/api/admin/users/${id}`, body),
  remove: (id) => del(`/api/admin/users/${id}`),
};

export const responses = {
  list: (params) => get(`/api/admin/responses?${new URLSearchParams(params).toString()}`),
  get: (id) => get(`/api/admin/responses/${id}`),
  update: (id, body) => put(`/api/admin/responses/${id}`, body),
};

export const analytics = {
  trend: (params) => get(`/api/admin/analytics/trend?${new URLSearchParams(params).toString()}`),
  sentiment: (params) => get(`/api/admin/analytics/sentiment?${new URLSearchParams(params).toString()}`),
  heatmap: (params) => get(`/api/admin/analytics/heatmap?${new URLSearchParams(params).toString()}`),
  weeklySummary: (params) => get(`/api/admin/analytics/weekly-summary?${new URLSearchParams(params).toString()}`),
};

export const qrcodes = {
  branch: (branchId, source) => get(`/api/admin/qrcodes/${branchId}${source ? `?source=${encodeURIComponent(source)}` : ''}`),
  branchDownloadUrl: (branchId, source, size) =>
    `/api/admin/qrcodes/${branchId}/download?${new URLSearchParams({ ...(source ? { source } : {}), ...(size ? { size } : {}) }).toString()}`,
  restaurant: (restaurantId, source) =>
    get(`/api/admin/qrcodes/restaurant/${restaurantId}${source ? `?source=${encodeURIComponent(source)}` : ''}`),
  restaurantDownloadUrl: (restaurantId, source, size) =>
    `/api/admin/qrcodes/restaurant/${restaurantId}/download?${new URLSearchParams({ ...(source ? { source } : {}), ...(size ? { size } : {}) }).toString()}`,
  sources: (branchId) => get(`/api/admin/qrcodes/${branchId}/sources`),
  createSource: (branchId, label) => post(`/api/admin/qrcodes/${branchId}/sources`, { label }),
  removeSource: (id) => del(`/api/admin/qrcodes/sources/${id}`),
};

export const exportApi = {
  responsesCsvUrl: (params) => `/api/admin/export/responses.csv?${new URLSearchParams(params).toString()}`,
};

export const settingsApi = {
  get: (restaurantId) => get(`/api/admin/settings/${restaurantId}`),
};

export { ApiError };
