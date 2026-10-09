import test from 'node:test';
import assert from 'node:assert/strict';
import { parseItemDescription } from '../../src/finance/utils/itemDescription.js';
import { invoiceSchema } from '../validation/schemas.js';
import { Invoice } from '../models/Invoice.js';

const description = `Custom website design and development.

1. Property listings for rentals, property sales and shortlets.
2. Property categories, locations and search-oriented navigation.
3. Property detail pages featuring prices, images, features and enquiry options.
4. Business information, services and contact pages.
5. WhatsApp and other contact-channel integration, subject to final requirements.
6. Mobile-responsive design for phones, tablets and desktops.
7. Website content and property information setup.
8. Preparation of Shelter Crafter's business information for its dedicated AI customer assistant.
9. AI assistant integration and configuration, subject to the agreed project scope.
10. Basic search-engine optimisation and website launch preparation.`;

test('pasted website scope retains its introduction and all ten numbered inclusions', () => {
  const blocks = parseItemDescription(description.replaceAll('\n', '\r\n'));
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0], { type: 'text', text: 'Custom website design and development.' });
  assert.equal(blocks[1].type, 'ordered');
  assert.deepEqual(blocks[1].items.map((item) => item.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(blocks[1].items[9].text, 'Basic search-engine optimisation and website launch preparation.');
});

test('plain paragraphs, decimals, alternate numbering and bullets remain readable', () => {
  const blocks = parseItemDescription('Version 2.5\n1.5 days\n\n3) Design\n4) Build\n- Launch\n• Support\n* Handover');
  assert.equal(blocks[0].text, 'Version 2.5\n1.5 days');
  assert.deepEqual(blocks[1].items.map((item) => item.number), [3, 4]);
  assert.equal(blocks[2].type, 'unordered');
  assert.equal(blocks[2].items.length, 3);
  assert.deepEqual(parseItemDescription(''), []);
});

test('invoice request and stored model accept the full scope as one priced item', () => {
  const data = invoiceSchema.parse({
    clientPublicId: '00112233-4455-4677-8899-aabbccddeeff',
    issueDate: '2026-10-09', dueDate: '2026-10-23', currency: 'NGN',
    items: [{ description, quantity: 1, unitPrice: 100000 }],
  });
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].description, description);
  const invoice = new Invoice({ ...data, number: 'TEST', owner: '00112233445566778899aabb', client: '00112233445566778899aabc', subtotal: 100000, discountAmount: 0, taxAmount: 0, total: 100000, items: [{ ...data.items[0], amount: 100000 }] });
  assert.equal(invoice.validateSync(), undefined);
  assert.equal(invoice.items[0].description, description);
  assert.equal(invoiceSchema.safeParse({ ...data, items: [{ ...data.items[0], description: 'x'.repeat(5001) }] }).success, false);
  invoice.items[0].description = 'x'.repeat(5001);
  assert.ok(invoice.validateSync()?.errors['items.0.description']);
});
