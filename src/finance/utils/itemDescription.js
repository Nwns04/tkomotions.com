// Keep descriptions as plain text; derive lists only when displaying them.
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
