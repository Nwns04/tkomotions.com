import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceItemsFromPaste, parseItemDescription } from '../../src/finance/utils/itemDescription.js';
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

const pricedDescription = `|   |
| - |
Service
|   |
| - |
Standard price
|   |
| - |
Website discovery, requirements & planning
|   |
| - |
₦40,000
|   |
| - |
UI/UX design and brand-aligned website layout
|   |
| - |
₦65,000
|   |
| - |
Homepage and core website pages
|   |
| - |
₦75,000
|   |
| - |
Property listings, details & search filters
|   |
| - |
₦80,000
|   |
| - |
Property enquiry and WhatsApp contact integration
|   |
| - |
₦25,000
|   |
| - |
Secure property listing admin dashboard
|   |
| - |
₦70,000
|   |
| - |
Mobile responsiveness and cross-browser testing
|   |
| - |
₦25,000
|   |
| - |
Basic SEO and performance optimization
|   |
| - |
₦20,000
|   |
| - |
Deployment and launch configuration
|   |
| - |
₦15,000
|   |
| - |
Total standard price
|   |
| - |
₦415,000?`;

test('the pasted service-price example creates nine priced rows totaling NGN 415,000', () => {
  const items = invoiceItemsFromPaste([{ description: '', quantity: 2, unitPrice: '100' }], 0, pricedDescription, 0, 0, 'NGN');
  assert.equal(items.length, 9);
  assert.deepEqual(items.map((item) => Number(item.unitPrice)), [40000, 65000, 75000, 80000, 25000, 70000, 25000, 20000, 15000]);
  assert.equal(items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0), 415000);
  assert.equal(items[0].description, 'Website discovery, requirements & planning');
  assert.equal(items[8].description, 'Deployment and launch configuration');
  assert.ok(items.every((item) => item.quantity === 1));
  assert.throws(() => invoiceItemsFromPaste([{ description: '' }], 0, pricedDescription, 0, 0, 'USD'), /Select NGN/);
});

test('markdown tables, spreadsheet rows and alternating text all fill prices and skip totals', () => {
  for (const text of [
    '| Service | Standard price |\n| --- | ---: |\n| Design | ₦40,000 |\n| Launch | ₦15,000 |\n| Total standard price | ₦55,000 |',
    'Service\tStandard price\nDesign\t40000\nLaunch\t15000\nTotal\t55000',
    'Service\nStandard price\nDesign\n₦40,000\nLaunch\n₦15,000\nTotal standard price\n₦55,000',
  ]) {
    const items = invoiceItemsFromPaste([{ description: '' }], 0, text, 0, 0, 'NGN');
    assert.deepEqual(items.map(({ description, unitPrice }) => [description, unitPrice]), [['Design', '40000'], ['Launch', '15000']]);
  }
  const usd = invoiceItemsFromPaste([{ description: '', quantity: 5, unitPrice: '10' }], 0, '**Design**\t$1,250.50', 0, 0, 'USD');
  assert.deepEqual(usd, [{ description: 'Design', quantity: 1, unitPrice: '1250.5' }]);
  assert.throws(() => invoiceItemsFromPaste([{ description: '' }], 0, 'Design\n₦40,00\nLaunch\n₦15,000', 0, 0, 'NGN'), /could not be read/);
  assert.throws(() => invoiceItemsFromPaste([{ description: '' }], 0, 'Design\n₦40,00', 0, 0, 'NGN'), /could not be read/);
  assert.throws(() => invoiceItemsFromPaste([{ description: '' }], 0, 'Design\n₦40,000\nLaunch', 0, 0, 'NGN'), /missing its price/);
});

test('plain descriptions still split when copied list numbering is removed', () => {
  const unnumbered = description.replace(/^\d+\. /gm, '');
  const items = invoiceItemsFromPaste([{ description: '', quantity: 1, unitPrice: '' }], 0, unnumbered, 0, 0);
  assert.equal(items.length, 11);
  assert.equal(items[10].description, 'Basic search-engine optimisation and website launch preparation.');
});

test('pasting the full scope creates a title row and ten separate items without copying its price', () => {
  const items = invoiceItemsFromPaste([{ description: '', quantity: 2, unitPrice: '1000' }], 0, description, 0, 0);
  assert.equal(items.length, 11);
  assert.deepEqual(items[0], { description: 'Custom website design and development.', quantity: 2, unitPrice: '1000' });
  assert.deepEqual(items[1], { description: 'Property listings for rentals, property sales and shortlets.', quantity: 1, unitPrice: '' });
  assert.equal(items[10].description, 'Basic search-engine optimisation and website launch preparation.');
  assert.ok(items.slice(1).every((item) => item.unitPrice === '' && item.quantity === 1));
});

test('list paste preserves surrounding rows, selected text boundaries and wrapped item text', () => {
  const before = { description: 'Before', quantity: 1, unitPrice: '10' };
  const after = { description: 'After', quantity: 1, unitPrice: '20' };
  const items = invoiceItemsFromPaste([before, { description: 'Start REPLACE end', quantity: 3, unitPrice: '30' }, after], 1, '- Design\n  and development\n• Launch', 6, 13);
  assert.equal(items.length, 4);
  assert.equal(items[0], before);
  assert.equal(items[1].description, 'Start Design\nand development');
  assert.equal(items[2].description, 'Launch end');
  assert.equal(items[3], after);
  assert.equal(invoiceItemsFromPaste([{ ...before, description: '' }], 0, 'Normal\nparagraph', 0, 0).length, 2);
  assert.equal(invoiceItemsFromPaste([before], 0, '1.5 days', 0, 0), null);
  assert.throws(() => invoiceItemsFromPaste(Array(250).fill(before), 0, '1. Design\n2. Launch', 0, 0), /250/);
});

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
