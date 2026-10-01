import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice, effectiveStatus } from './invoiceMath.js';
import { invoiceSchema, receiptSchema } from '../validation/schemas.js';

test('calculates percentage discount and tax in minor units', () => {
  const result = calculateInvoice({
    items: [{ quantity: 2, unitPrice: 10000 }, { quantity: 1, unitPrice: 5000 }],
    discountType: 'percentage',
    discountValue: 10,
    taxEnabled: true,
    taxRate: 7.5,
  });
  assert.deepEqual(result, { subtotal: 25000, discountAmount: 2500, taxAmount: 1688, total: 24188 });
});

test('computes overdue without mutating stored status', () => {
  const invoice = { status: 'Sent', amountPaid: 0, total: 1000, dueDate: '2025-01-01' };
  assert.equal(effectiveStatus(invoice, new Date('2025-01-02')), 'Overdue');
  assert.equal(invoice.status, 'Sent');
});

test('does not mark an invoice overdue until the due date has ended', () => {
  const invoice = { status: 'Sent', amountPaid: 0, total: 1000, dueDate: '2026-09-28' };
  assert.equal(effectiveStatus(invoice, new Date('2026-09-28T12:00:00Z'), 'Africa/Lagos'), 'Sent');
  assert.equal(effectiveStatus(invoice, new Date('2026-09-29T00:00:00Z'), 'Africa/Lagos'), 'Overdue');
});

test('rejects percentage discounts above 100 percent', () => {
  const result = invoiceSchema.safeParse({
    clientPublicId: '66b80b94-9d76-4ec2-9b62-e5e8380fa169',
    issueDate: '2026-09-28',
    dueDate: '2026-10-12',
    currency: 'NGN',
    items: [{ description: 'Motion design', quantity: 1, unitPrice: 10000 }],
    discountType: 'percentage',
    discountValue: 101,
    taxEnabled: false,
    taxRate: 0,
  });
  assert.equal(result.success, false);
});

test('requires and preserves receipt currency', () => {
  const result = receiptSchema.safeParse({
    clientPublicId: '66b80b94-9d76-4ec2-9b62-e5e8380fa169',
    invoicePublicId: '',
    amount: 10000,
    currency: 'USD',
    paymentDate: '2026-09-28',
    method: 'Bank Transfer',
    reference: '',
    purpose: 'Deposit',
    notes: '',
  });
  assert.equal(result.success, true);
  assert.equal(result.data.currency, 'USD');
});
