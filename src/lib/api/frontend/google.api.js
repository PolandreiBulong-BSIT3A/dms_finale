import { buildUrl } from './client.js';

export const googleAuth = () => {
  // Redirect to backend Google OAuth endpoint
  window.location.href = buildUrl('auth/google');
};
