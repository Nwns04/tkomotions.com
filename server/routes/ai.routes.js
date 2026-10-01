import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { aiQuotationRequestSchema } from '../validation/schemas.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { Client } from '../models/Client.js';
import { AIUsageLog } from '../models/AIUsageLog.js';
import { aiConfiguration, aiProvider } from '../services/ai/index.js';
import { createAiAttestation } from '../services/ai/attestation.js';

const router = Router();
router.use(requireAuth);

const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'AI request limit reached. Continue manually or try again later.' },
});

function safeCurrentQuotation(value) {
  if (!value || typeof value !== 'object') return null;
  const allowed = ['title', 'summary', 'currency', 'items', 'includedFeatures', 'excludedFeatures', 'assumptions', 'optionalAdditions', 'paymentTerms', 'formalCopy', 'whatsAppCopy'];
  return Object.fromEntries(allowed.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]));
}

router.post('/quotation', generationLimiter, requireCsrf, validate(aiQuotationRequestSchema), async (req, res) => {
  let clientName = req.body.clientName;
  if (req.body.clientPublicId) {
    const client = await Client.findOne({ publicId: req.body.clientPublicId, owner: req.user._id, archivedAt: null });
    if (!client) return res.status(422).json({ message: 'Selected client was not found.' });
    clientName = client.name;
  }

  const catalogQuery = { owner: req.user._id, active: true, currency: req.body.currency };
  if (req.body.selectedCatalogPublicIds.length) catalogQuery.publicId = { $in: req.body.selectedCatalogPublicIds };
  const catalog = await CatalogItem.find(catalogQuery).limit(100);

  const operation = req.body.operation;
  const result = await aiProvider[operation]({
    requirements: req.body.requirements,
    targetBudget: req.body.targetBudget,
    currency: req.body.currency,
    selectedCatalogPublicIds: req.body.selectedCatalogPublicIds,
    clientName,
    currentQuotation: safeCurrentQuotation(req.body.currentQuotation),
    revisionInstruction: req.body.revisionInstruction,
    catalog: catalog.map((item) => item.toJSON()),
  }, { ownerId: req.user._id });

  if (result.mode === 'manual') return res.json(result);

  const catalogById = new Map(catalog.map((item) => [item.publicId, item]));
  const pricingWarnings = [];
  result.data.lineItems = result.data.lineItems.map((lineItem) => {
    const catalogItem = catalogById.get(lineItem.catalogPublicId);
    if (!catalogItem) {
      pricingWarnings.push(`${lineItem.description}: custom pricing is not backed by an active catalog item and must be reviewed.`);
      return { ...lineItem, catalogPublicId: '' };
    }
    if (lineItem.unitPrice !== catalogItem.unitPrice) pricingWarnings.push(`${catalogItem.name}: AI price was replaced by the catalog price.`);
    return { ...lineItem, description: lineItem.description || catalogItem.name, unitPrice: catalogItem.unitPrice };
  });
  result.data.internalWarnings = [...new Set([...result.data.internalWarnings, ...pricingWarnings])];
  return res.json({
    ...result,
    attestation: createAiAttestation({ ownerId: req.user._id, provider: result.provider, model: result.model, fallbackUsed: result.fallbackUsed }),
  });
});

let healthCache = { expiresAt: 0, value: null };
router.get('/status', async (req, res) => {
  if (Date.now() >= healthCache.expiresAt) {
    healthCache = { value: await aiProvider.checkProviderHealth(), expiresAt: Date.now() + 60_000 };
  }
  const [lastSuccess, lastFallback, recentUsage] = await Promise.all([
    AIUsageLog.findOne({ owner: req.user._id, success: true }).sort({ createdAt: -1 }),
    AIUsageLog.findOne({ owner: req.user._id, fallbackUsed: true, success: true }).sort({ createdAt: -1 }),
    AIUsageLog.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(20),
  ]);
  res.json({
    configuration: aiConfiguration,
    health: healthCache.value,
    lastSuccessfulRequest: lastSuccess?.createdAt || null,
    lastProviderUsed: lastSuccess?.provider || null,
    fallbackWasRequired: Boolean(lastFallback && lastSuccess && lastFallback.createdAt.getTime() === lastSuccess.createdAt.getTime()),
    usage: recentUsage,
  });
});

export default router;
