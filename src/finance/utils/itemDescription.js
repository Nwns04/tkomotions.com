// Keep stored descriptions as plain text.
function pastedPrice(value) {
  const match = value.match(/^(₦|NGN|USD|GBP|\$|£)?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(NGN|USD|GBP)?$/i);
  if (!match) return null;
  const currencies = { '₦': 'NGN', '$': 'USD', '£': 'GBP' };
  const prefix = match[1] ? currencies[match[1]] || match[1].toUpperCase() : undefined;
  const suffix = match[4]?.toUpperCase();
  if (prefix && suffix && prefix !== suffix) throw new Error('A pasted price has conflicting currencies. Use one currency per invoice.');
  const amount = Number(match[2].replaceAll(',', '') + (match[3] ? `.${match[3]}` : ''));
  if (amount > 9_000_000_000) throw new Error('A pasted unit price exceeds the supported invoice amount.');
  return { unitPrice: String(amount), currency: prefix || suffix };
}

function pricedItemsFromPaste(text, currency) {
  const tokens = text.split('\n').flatMap((line) => line.split(/[|\t]/))
    .map((cell) => cell.trim().replace(/^(?:\*\*|__)(.*)(?:\*\*|__)$/, '$1'))
    .filter((cell) => cell && !/^[:\s-]+$/.test(cell));
  const header = /^(?:services?|description|standard price|unit price|price|amount)$/i;
  const total = /^(?:(?:grand\s+)?total(?:\s+(?:standard\s+)?price)?|subtotal)(?:\s*:)?$/i;
  const prices = tokens.map(pastedPrice);
  const hasTable = /[|\t]/.test(text) || tokens.some((token) => header.test(token));
  if (!prices.some((price) => price && (hasTable || price.currency))) {
    if (tokens.some((token) => /^(?:[₦$£]|NGN\b|USD\b|GBP\b)\s*[-\d]/i.test(token))) throw new Error('A pasted price could not be read. Use an amount such as ₦40,000 or 40000.');
    return null;
  }

  const rows = [];
  let description = '';
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const token = tokens[tokenIndex];
    if (header.test(token)) continue;
    if (total.test(token)) {
      if (description) throw new Error('A pasted service is missing its price. Add a price for each service.');
      if (prices[tokenIndex + 1] || /^\s*[₦$£]/.test(tokens[tokenIndex + 1] || '')) tokenIndex++;
      continue;
    }
    const price = prices[tokenIndex];
    if (price) {
      if (!description) throw new Error('Each pasted price needs a service description before it.');
      if (price.currency && currency && price.currency !== currency) throw new Error(`The pasted prices use ${price.currency}. Select ${price.currency} as the invoice currency before pasting.`);
      rows.push({ description, quantity: 1, unitPrice: price.unitPrice });
      description = '';
    } else {
      if (/[₦$£]|\b(?:NGN|USD|GBP)\b/.test(token)) throw new Error('A pasted price could not be read. Use an amount such as ₦40,000 or 40000.');
      description += (description ? '\n' : '') + token;
    }
  }
  if (description) throw new Error('A pasted service is missing its price. Add a price for each service.');
  if (!rows.length) throw new Error('Paste at least one service with its price.');
  return rows;
}

export function invoiceItemsFromPaste(items, index, pastedText, selectionStart, selectionEnd, currency) {
  const text = String(pastedText).replace(/\r\n?/g, '\n')
    .replace(/&(?:nbsp|#160|#x0*a0);/gi, ' ').replace(/&(?:#32|#x0*20);/gi, ' ').replace(/&amp;/gi, '&');
  const pricedItems = pricedItemsFromPaste(text, currency);
  const descriptions = [];
  let hasList = false;
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s*(?:\d{1,6}[.)]|[-*•])\s+(.+)$/);
    if (marker) {
      hasList = true;
      descriptions.push(marker[1].trim());
    } else if (line.trim()) {
      if (!descriptions.length) descriptions.push(line.trim());
      else descriptions[descriptions.length - 1] += `\n${line.trim()}`;
    }
  }
  // Without list markers, each nonempty pasted line is its own invoice item.
  const plainLines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const pastedItems = pricedItems || (hasList ? descriptions : plainLines).map((description) => ({ description }));
  if (!pricedItems && pastedItems.length < 2) return null;
  if (items.length + pastedItems.length - 1 > 250) throw new Error('An invoice can contain up to 250 line items. Paste a shorter list.');

  const original = items[index];
  pastedItems[0].description = original.description.slice(0, selectionStart) + pastedItems[0].description;
  pastedItems[pastedItems.length - 1].description += original.description.slice(selectionEnd);
  if (pastedItems.some((item) => item.description.length > 5000)) throw new Error('Each line item description can contain up to 5,000 characters.');
  const inserted = pastedItems.map((item, itemIndex) => ({
    ...(itemIndex === 0 ? original : { quantity: 1, unitPrice: '' }),
    ...item,
  }));
  return [...items.slice(0, index), ...inserted, ...items.slice(index + 1)];
}

export function parseItemDescription(value = '') {
  const blocks = [];
  let current;
  for (const line of String(value).replace(/\r\n?/g, '\n').split('\n')) {
    const numbered = line.match(/^\s*(\d{1,6})[.)]\s+(.+)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    if (numbered || bullet) {
      const type = numbered ? 'ordered' : 'unordered';
      if (current?.type !== type) {
        current = { type, items: [] };
        blocks.push(current);
      }
      current.items.push({ text: numbered ? numbered[2] : bullet[1], number: numbered ? Number(numbered[1]) : undefined });
    } else if (line.trim()) {
      if (current?.type !== 'text') {
        current = { type: 'text', text: '' };
        blocks.push(current);
      }
      current.text += (current.text ? '\n' : '') + line;
    } else {
      current = undefined;
    }
  }
  return blocks;
}
