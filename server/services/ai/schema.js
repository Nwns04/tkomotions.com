import { z } from 'zod';

export const quotationAIJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    serviceCategory: { type: 'string', description: 'The best matching TKO service category.' },
    detectedPackage: { type: 'string', description: 'The best matching package or an empty string.' },
    title: { type: 'string' },
    summary: { type: 'string' },
    currency: { type: 'string', enum: ['NGN', 'USD', 'GBP'] },
    lineItems: {
      type: 'array',
      minItems: 1,
      maxItems: 50,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number', minimum: 0.01 },
          unitPrice: { type: 'integer', minimum: 0, description: 'Proposed price in minor currency units.' },
          catalogPublicId: { type: 'string', description: 'Matching catalog public ID, or an empty string.' },
        },
        required: ['description', 'quantity', 'unitPrice', 'catalogPublicId'],
      },
    },
    includedFeatures: { type: 'array', items: { type: 'string' } },
    excludedFeatures: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    optionalAdditions: { type: 'array', items: { type: 'string' } },
    internalWarnings: { type: 'array', items: { type: 'string' } },
    suggestedPaymentTerms: { type: 'string' },
    formalQuotationCopy: { type: 'string' },
    whatsAppCopy: { type: 'string' },
  },
  required: [
    'serviceCategory', 'detectedPackage', 'title', 'summary', 'currency', 'lineItems',
    'includedFeatures', 'excludedFeatures', 'assumptions', 'optionalAdditions',
    'internalWarnings', 'suggestedPaymentTerms', 'formalQuotationCopy', 'whatsAppCopy',
  ],
};

const boundedStrings = (maxItems, maxLength) => z.array(z.string().trim().max(maxLength)).max(maxItems);

export const quotationAIResultSchema = z.object({
  serviceCategory: z.string().trim().max(160),
  detectedPackage: z.string().trim().max(160),
  title: z.string().trim().min(1).max(220),
  summary: z.string().trim().max(4000),
  currency: z.enum(['NGN', 'USD', 'GBP']),
  lineItems: z.array(z.object({
    description: z.string().trim().min(1).max(600),
    quantity: z.number().positive().max(1_000_000),
    unitPrice: z.number().int().min(0).max(9_000_000_000_00),
    catalogPublicId: z.string().trim().max(80),
  }).strict()).min(1).max(50),
  includedFeatures: boundedStrings(100, 500),
  excludedFeatures: boundedStrings(100, 500),
  assumptions: boundedStrings(100, 500),
  optionalAdditions: boundedStrings(100, 500),
  internalWarnings: boundedStrings(100, 500),
  suggestedPaymentTerms: z.string().trim().max(4000),
  formalQuotationCopy: z.string().trim().max(10000),
  whatsAppCopy: z.string().trim().max(4000),
}).strict();
