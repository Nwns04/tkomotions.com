import { apiMessage } from '../../api/client.js';

export function outreachActionMessage(error) {
  if (!error?.response && !error?.isAxiosError) return error?.message || 'The request could not be completed.';
  const uncertain = !error.response || error.response.status >= 500;
  if (uncertain) {
    const path = error.config?.url || '';
    if (path.endsWith('/outreach/schedule')) return 'Scheduling could not be confirmed. Refresh contacts before retrying; some contacts may already be scheduled.';
    if (path.endsWith('/send')) return 'Email status could not be confirmed. Refresh contacts before trying again.';
    return 'The request could not be confirmed. Refresh before trying again.';
  }
  return apiMessage(error);
}
