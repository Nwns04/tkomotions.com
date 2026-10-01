import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/finance',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let csrfToken = '';
export function setCsrfToken(token) { csrfToken = token || ''; }

api.interceptors.request.use((config) => {
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export function apiMessage(error) {
  const data = error.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((item) => `${item.field ? `${item.field}: ` : ''}${item.message}`).join(' ');
  }
  return data?.message || 'Something went wrong. Please try again.';
}

export async function downloadPdf(path, filename) {
  const response = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
