export function calculateInvoice(values) {
  const subtotal = (values.items || []).reduce(
    (sum, item) => sum + Math.round(Number(item.quantity) * Number(item.unitPrice)),
    0,
  );
  const discountValue = Math.max(0, Number(values.discountValue) || 0);
  const discountAmount = values.discountType === 'percentage'
    ? Math.round(subtotal * Math.min(discountValue, 100) / 100)
    : Math.min(Math.round(discountValue), subtotal);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxRate = values.taxEnabled ? Math.max(0, Number(values.taxRate) || 0) : 0;
  const taxAmount = Math.round(taxable * taxRate / 100);
  const total = taxable + taxAmount;

  return { subtotal, discountAmount, taxAmount, total };
}

export function businessDateKey(value = new Date(), timeZone = 'Africa/Lagos') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function effectiveStatus(invoice, now = new Date(), timeZone = 'Africa/Lagos') {
  if (invoice.status === 'Cancelled') return 'Cancelled';
  if (invoice.amountPaid >= invoice.total && invoice.total > 0) return 'Paid';
  if (invoice.amountPaid > 0) return 'Partially Paid';
  const dueDateKey = new Date(invoice.dueDate).toISOString().slice(0, 10);
  if (invoice.status !== 'Draft' && dueDateKey < businessDateKey(now, timeZone)) return 'Overdue';
  return invoice.status;
}
