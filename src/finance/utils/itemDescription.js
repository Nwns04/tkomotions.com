// Keep stored descriptions as plain text.
export function invoiceItemsFromPaste(items, index, pastedText, selectionStart, selectionEnd) {
  const descriptions = [];
  let hasList = false;
  for (const line of String(pastedText).replace(/\r\n?/g, '\n').split('\n')) {
    const marker = line.match(/^\s*(?:\d{1,6}[.)]|[-*•])\s+(.+)$/);
    if (marker) {
      hasList = true;
      descriptions.push(marker[1].trim());
    } else if (line.trim()) {
      if (!descriptions.length) descriptions.push(line.trim());
      else descriptions[descriptions.length - 1] += `\n${line.trim()}`;
    }
  }
  if (!hasList || descriptions.length < 2) return null;
  if (items.length + descriptions.length - 1 > 250) throw new Error('An invoice can contain up to 250 line items. Paste a shorter list.');

  const original = items[index];
  descriptions[0] = original.description.slice(0, selectionStart) + descriptions[0];
  descriptions[descriptions.length - 1] += original.description.slice(selectionEnd);
  if (descriptions.some((text) => text.length > 5000)) throw new Error('Each line item description can contain up to 5,000 characters.');
  const inserted = descriptions.map((description, itemIndex) => itemIndex === 0
    ? { ...original, description }
    : { description, quantity: 1, unitPrice: '' });
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
