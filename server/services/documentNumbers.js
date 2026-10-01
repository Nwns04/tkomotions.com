import { randomBytes } from 'node:crypto';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function randomCode(length = 5) {
  const bytes = randomBytes(length);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

export async function createDocumentNumber(model, type, date = new Date()) {
  const year = String(date.getUTCFullYear()).slice(-2);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const number = `TKO-${type}-${year}-${randomCode()}`;
    if (!(await model.exists({ number }))) return number;
  }

  throw new Error('Could not generate a unique document number.');
}
