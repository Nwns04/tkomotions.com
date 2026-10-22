export const csvHeaders = ['company', 'name', 'email', 'subject', 'message', 'followup', 'followup2', 'delayDays', 'followup2DelayDays', 'permissionBasis', 'autoFollowup'];

export function parseOutreachCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < source.length; i++) {
    const character = source[i];
    if (quoted) {
      if (character === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n' || character === '\r') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (quoted) throw new Error('The CSV has an unclosed quoted field.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) throw new Error('The CSV is empty.');
  const normalized = value => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = { followup1body: 'followup', followup1: 'followup', followup2body: 'followup2', followup1delaydays: 'delayDays', followup2delaydays: 'followup2DelayDays', delaydays2: 'followup2DelayDays', initialbody: 'message', initialsubject: 'subject', contactemail: 'email', businessname: 'company', followupenabled: 'autoFollowup' };
  const headers = rows.shift().map(value => csvHeaders.find(header => normalized(header) === normalized(value)) || aliases[normalized(value)]);
  if (!headers.includes('email')) throw new Error('The CSV needs an email column.');
  const contacts = rows.filter(values => values.some(value => value.trim())).map(values => Object.fromEntries(headers.flatMap((header, index) => header ? [[header, values[index] || (header === 'delayDays' ? 4 : header === 'followup2DelayDays' ? 10 : '')]] : [])));
  if (contacts.length > 500) throw new Error('Import at most 500 contacts per file. Split this file and try again.');
  return contacts.map(contact => {
    for (const key of ['delayDays', 'followup2DelayDays']) {
      if (contact[key] !== undefined && contact[key] !== '') contact[key] = Number(contact[key]);
      else delete contact[key];
    }
    if (contact.autoFollowup !== undefined) {
      const text = String(contact.autoFollowup).trim().toLowerCase();
      if (!['true', '1', 'yes', 'on', 'false', '0', 'no', 'off', ''].includes(text)) throw new Error('Invalid autoFollowup value; use true or false.');
      contact.autoFollowup = ['true', '1', 'yes', 'on'].includes(text);
    }
    return contact;
  });
}

export function exampleOutreachCsv() {
  const cells = ['Example Company', 'Contact name', 'hello@example.com', 'A quick introduction', 'Hello,\nI wanted to introduce TKO Motions.', 'Hello,\nJust following up on my introduction.', 'Hello,\nA final check-in.', '4', '10', '', 'false'];
  return csvHeaders.join(',') + '\n' + cells.map(value => '"' + value.replaceAll('"', '""') + '"').join(',') + '\n';
}
