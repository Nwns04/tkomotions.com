const monetarySentence = /\b(?:NGN|USD|GBP)\s*[\d,]+(?:\.\d+)?|[₦$£]\s*[\d,]+(?:\.\d+)?|\b(?:total cost|total price|price|amount payable|quoted at)\b[^.!?]*\d/i;

export function removeMonetaryClaims(copy = '') {
  return String(copy)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !monetarySentence.test(sentence))
    .join(' ')
    .trim();
}
