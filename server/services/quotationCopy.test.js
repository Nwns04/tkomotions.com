import test from 'node:test';
import assert from 'node:assert/strict';
import { removeMonetaryClaims } from './quotationCopy.js';

test('removes an AI-generated incorrect currency total but preserves proposal copy', () => {
  const copy = 'We are pleased to submit our quotation for your website. The total cost is NGN 15,000,000, payable 50% upfront and 50% upon completion. We look forward to working with you.';
  assert.equal(
    removeMonetaryClaims(copy),
    'We are pleased to submit our quotation for your website. We look forward to working with you.',
  );
});

test('removes currency-symbol prices and unlabelled total price sentences', () => {
  assert.equal(removeMonetaryClaims('Our proposal is tailored for your team. Price: 150,000. Delivery starts after approval.'), 'Our proposal is tailored for your team. Delivery starts after approval.');
  assert.equal(removeMonetaryClaims('A clear scope for the project. The quote is £1,250. Please review the schedule.'), 'A clear scope for the project. Please review the schedule.');
});
