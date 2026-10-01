import { z } from 'zod';

const text = (max) => z.string().trim().max(max).default('');
const requiredText = (max, label) => z.string().trim().min(1, `${label} is required.`).max(max);
const date = z.coerce.date();
const currency = z.enum(['NGN', 'USD', 'GBP']);
const method = z.enum(['Bank Transfer', 'Cash', 'Card', 'Crypto', 'Other']);

export const loginSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

export const clientSchema = z.object({
  name: requiredText(160, 'Client name'),
  company: text(160),
  email: z.union([z.literal(''), z.email().max(254)]).default(''),
  phone: text(40),
  address: text(1000),
  notes: text(3000),
});

const invoiceItem = z.object({
  description: requiredText(500, 'Line item description'),
  quantity: z.coerce.number().positive().max(1_000_000),
  unitPrice: z.coerce.number().int().min(0).max(9_000_000_000_00),
});

export const invoiceSchema = z.object({
  clientPublicId: z.uuid(),
  issueDate: date,
  dueDate: date,
  currency,
  items: z.array(invoiceItem).min(1).max(250),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.coerce.number().min(0).default(0),
  taxEnabled: z.boolean().default(false),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: text(5000),
  paymentInstructions: text(5000),
  terms: text(5000),
}).refine((data) => data.discountType !== 'percentage' || data.discountValue <= 100, {
  message: 'Percentage discount cannot exceed 100%.',
  path: ['discountValue'],
}).refine((data) => data.dueDate >= data.issueDate, {
  message: 'Due date must be on or after the issue date.',
  path: ['dueDate'],
});

export const paymentSchema = z.object({
  invoicePublicId: z.uuid(),
  amount: z.coerce.number().int().positive(),
  paymentDate: date,
  method,
  reference: text(200),
  notes: text(2000),
  generateReceipt: z.boolean().default(true),
});

export const receiptSchema = z.object({
  clientPublicId: z.uuid(),
  invoicePublicId: z.union([z.literal(''), z.uuid()]).default(''),
  amount: z.coerce.number().int().positive(),
  currency,
  paymentDate: date,
  method,
  reference: text(200),
  purpose: requiredText(1000, 'Purpose'),
  notes: text(2000),
});

export const settingsSchema = z.object({
  businessName: requiredText(160, 'Business name'),
  logoUrl: text(2000),
  ceoName: text(160),
  ceoTitle: text(100),
  signatureUrl: text(2000),
  email: z.union([z.literal(''), z.email().max(254)]).default(''),
  phone: text(40),
  address: text(1000),
  website: text(500),
  defaultCurrency: currency,
  bankAccounts: z.array(z.object({
    currency,
    bankName: text(160),
    accountName: text(160),
    accountNumber: text(80),
    ibanSwift: text(160),
  })).max(3).default([]).superRefine((accounts, context) => {
    const currencies = accounts.map((account) => account.currency);
    if (new Set(currencies).size !== currencies.length) {
      context.addIssue({ code: 'custom', message: 'Only one bank account can be configured per currency.', path: ['currency'] });
    }
  }),
  bankName: text(160),
  accountName: text(160),
  accountNumber: text(80),
  ibanSwift: text(160),
  paymentInstructions: text(5000),
  defaultTerms: text(5000),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(0),
});

export const logoUploadSchema = z.object({
  dataUrl: z.string().max(1_000_000).regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'Upload a PNG, JPEG, or WebP image under 700 KB.'),
});

const stringList = (maxItems = 100, maxLength = 500) => z.array(z.string().trim().max(maxLength)).max(maxItems).default([]);

export const quotationSchema = z.object({
  clientPublicId: z.union([z.literal(''), z.uuid()]).default(''),
  prospectName: text(180),
  title: requiredText(220, 'Quotation title'),
  summary: text(4000),
  serviceCategory: text(160),
  detectedPackage: text(160),
  issueDate: date,
  validUntil: date,
  currency,
  items: z.array(invoiceItem.extend({ sourceCatalogPublicId: text(80) })).min(1).max(250),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.coerce.number().min(0).default(0),
  taxEnabled: z.boolean().default(false),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  includedFeatures: stringList(),
  excludedFeatures: stringList(),
  assumptions: stringList(),
  optionalAdditions: stringList(),
  internalWarnings: stringList(),
  paymentTerms: text(4000),
  formalCopy: text(10000),
  whatsAppCopy: text(4000),
  aiAttestation: text(2000),
}).refine((data) => data.discountType !== 'percentage' || data.discountValue <= 100, {
  message: 'Percentage discount cannot exceed 100%.',
  path: ['discountValue'],
}).refine((data) => data.validUntil >= data.issueDate, {
  message: 'Valid-until date must be on or after the issue date.',
  path: ['validUntil'],
}).refine((data) => Boolean(data.clientPublicId || data.prospectName), {
  message: 'Select a client or enter a prospective client name.',
  path: ['prospectName'],
});

export const aiQuotationRequestSchema = z.object({
  requirements: requiredText(12000, 'Requirements'),
  clientPublicId: z.union([z.literal(''), z.uuid()]).default(''),
  clientName: text(180),
  currency,
  targetBudget: z.union([z.null(), z.coerce.number().int().min(0)]).default(null),
  selectedCatalogPublicIds: z.array(z.uuid()).max(100).default([]),
  currentQuotation: z.record(z.string(), z.unknown()).nullable().default(null),
  revisionInstruction: text(6000),
  operation: z.enum(['generateQuotation', 'reviseQuotation', 'generateFormalCopy', 'generateWhatsAppCopy', 'recommendPricing']).default('generateQuotation'),
});

export const catalogItemSchema = z.object({
  name: requiredText(180, 'Service name'),
  category: requiredText(120, 'Category'),
  packageName: text(160),
  description: text(1200),
  currency,
  unitPrice: z.coerce.number().int().min(0).max(9_000_000_000_00),
  pricingNotes: text(1200),
  includedFeatures: stringList(50, 500),
  active: z.boolean().default(true),
});

export const quotationConversionSchema = z.object({
  clientPublicId: z.uuid(),
  issueDate: date,
  dueDate: date,
}).refine((data) => data.dueDate >= data.issueDate, {
  message: 'Due date must be on or after the issue date.',
  path: ['dueDate'],
});
