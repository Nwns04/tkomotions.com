export const formatMoney = (amount = 0, currency = 'NGN') => new Intl.NumberFormat('en-NG', {
  style: 'currency', currency, maximumFractionDigits: 2,
}).format(Number(amount) / 100);

export const formatDate = (date) => date ? new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(date)) : '—';

export const inputDate = (date = new Date()) => {
  const value = new Date(date);
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

export const toMinor = (value) => Math.round((Number(value) || 0) * 100);
export const fromMinor = (value) => Number(value || 0) / 100;

// Match the server payment limit using stored totals, rather than a derived API field.
export const outstandingBalance = (invoice) => Math.max(0, (Number(invoice.total) || 0) - (Number(invoice.amountPaid) || 0));

export const calculateDraft = (invoice) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + Math.round((Number(item.quantity) || 0) * toMinor(item.unitPrice)), 0);
  const discountValue = Number(invoice.discountValue) || 0;
  const discountAmount = invoice.discountType === 'percentage'
    ? Math.round(subtotal * Math.min(discountValue, 100) / 100)
    : Math.min(toMinor(discountValue), subtotal);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = invoice.taxEnabled ? Math.round(taxable * (Number(invoice.taxRate) || 0) / 100) : 0;
  return { subtotal, discountAmount, taxAmount, total: taxable + taxAmount };
};
