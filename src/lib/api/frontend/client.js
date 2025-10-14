// Unified API client for frontend requests (project_19)
// Reads base URL from Vite env with sensible fallback
import { fetchWithRetry } from './http.js';

// Determine API base URL with safe fallbacks
export const API_BASE_URL = (() => {
  // 1) Prefer Vite env var in builds
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    console.log('[API Client] Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 1.5) Check build-time defined variable
  if (typeof __API_BASE_URL__ !== 'undefined' && __API_BASE_URL__) {
    console.log('[API Client] Using build-time API_BASE_URL:', __API_BASE_URL__);
    return __API_BASE_URL__;
  }
  
  // 2) Check for production environment indicators
  const isProduction = typeof window !== 'undefined' && (
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('localhost')
  );
  
  // 3) Use current origin + '/api' when running in a browser
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const url = `${window.location.origin}/api`;
    console.log('[API Client] Using window.location.origin:', url);
    console.log('[API Client] Production mode:', isProduction);
    console.log('[API Client] Hostname:', window.location.hostname);
    return url;
  }
  
  // 4) Last resort: localhost (useful for Node/test contexts)
  console.log('[API Client] Falling back to localhost');
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
