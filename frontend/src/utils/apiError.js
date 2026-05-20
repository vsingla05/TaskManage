/**
 * Human-readable message from Axios / API errors (validation array, network, etc.).
 */
export function getApiErrorMessage(err, fallback = 'Request failed') {
  const data = err.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first?.msg === 'string') return first.msg;
    if (typeof first?.message === 'string') return first.message;
  }
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    const api = import.meta.env.VITE_API_URL || '(Vite proxy → backend)';
    return `Cannot reach API at ${api}. Check DevTools → Network (not the local backend terminal unless VITE_API_URL is http://localhost:5001).`;
  }
  const status = err.response?.status;
  if (status === 500) {
    return (
      data?.message ||
      'Server error (500). Look at the backend terminal for the red error line, then try again.'
    );
  }
  if (err.message && !/^Request failed with status code \d+$/.test(err.message)) {
    return err.message;
  }
  if (status) return `${fallback} (${status})`;
  return fallback;
}
