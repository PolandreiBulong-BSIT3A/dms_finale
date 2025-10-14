// Unified API client for frontend requests (project_19)
// Reads base URL from Vite env with sensible fallback
import { fetchWithRetry } from './http.js';

// Determine API base URL with safe fallbacks
export const API_BASE_URL = (() => {
  // 1) Prefer Vite env var in builds
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 2) Production: always use Render backend
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'ispsctagudindms.com') {
    return 'https://dms-finale.onrender.com/api';
  }
  // 3) Development: use localhost
  return 'http://localhost:5000/api';
})();

export const buildUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const sep = path.startsWith('/') ? '' : '/';
  return `${API_BASE_URL}${sep}${path}`;
};

// Re-export for convenience so callers can import from a single module
export { fetchWithRetry };

export const fetchJson = async (input, options = {}) => {
  const url = typeof input === 'string' ? input : input?.toString?.() ?? '';
  // Attempt to read tokens from storage (keeps working outside React context)
  let storedAccessToken = null;
  try {
    storedAccessToken =
      (typeof localStorage !== 'undefined' && localStorage.getItem('accessToken')) ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('accessToken')) ||
      null;
  } catch {}
  const mergedOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  // Prefer caller-provided Authorization, otherwise inject from storage
  if (storedAccessToken && !mergedOptions.headers.Authorization) {
    mergedOptions.headers.Authorization = `Bearer ${storedAccessToken}`;
  }

  // Helper to perform the actual request
  const doRequest = async () => {
    const res = await fetchWithRetry(url, mergedOptions);
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  let { res, data } = await doRequest();

  // If unauthorized, attempt a single token refresh then retry once
  if (res.status === 401) {
    try {
      const refreshRes = await fetchWithRetry(buildUrl('refresh-token'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json().catch(() => ({}));
        const newAccess = refreshData?.tokens?.accessToken;
        const newRefresh = refreshData?.tokens?.refreshToken;
        if (newAccess) {
          // Store tokens according to rememberMe flag
          const rememberMe = (typeof localStorage !== 'undefined' && localStorage.getItem('rememberMe')) || 'false';
          try {
            if (rememberMe === 'true' && typeof localStorage !== 'undefined') {
              localStorage.setItem('accessToken', newAccess);
              if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
            } else if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('accessToken', newAccess);
              if (newRefresh) sessionStorage.setItem('refreshToken', newRefresh);
            }
          } catch {}

          // Update Authorization header and retry once
          mergedOptions.headers.Authorization = `Bearer ${newAccess}`;
          ({ res, data } = await doRequest());
        }
      }
    } catch {}
  }

  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};
