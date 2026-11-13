const isBrowser = typeof window !== 'undefined';
const isLocal =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

// Production default points to the live Render backend, localhost when developing locally
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isLocal ? 'http://localhost:4321' : 'https://loc-qr-api.onrender.com');

export function getAuthToken() {
  try {
    const raw = localStorage.getItem('rms_jwt_access');
    if (raw) return raw;
    const session = localStorage.getItem('rms_user');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    const err = new Error(errorData.error || `Request failed with status ${response.status}`);
    err.code = errorData.code;
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export function connectOrderSSE(onEvent) {
  const token = getAuthToken();
  const url = `${API_BASE}/orders/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  const eventSource = new EventSource(url, {
    withCredentials: true,
  });

  eventSource.addEventListener('order.new', (e) => {
    try {
      onEvent('order.new', JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse order.new payload', err);
    }
  });

  eventSource.addEventListener('order.status_changed', (e) => {
    try {
      onEvent('order.status_changed', JSON.parse(e.data));
    } catch (err) {
      console.error('Failed to parse order.status_changed payload', err);
    }
  });

  return eventSource;
}
