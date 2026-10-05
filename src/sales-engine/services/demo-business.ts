import { Business, KnowledgeChunk, KnowledgeDocument, type BusinessDocument } from '../db/models';

const knowledge = [
  ['3-bedroom apartment in Wuse', '3-bedroom apartment. Location: Wuse. Price: ₦85,000,000.'],
  ['4-bedroom duplex in Gwarinpa', '4-bedroom duplex. Location: Gwarinpa. Price: ₦120,000,000.'],
  ['4-bedroom terrace in Jabi', '4-bedroom terrace. Location: Jabi. Price: ₦95,000,000.'],
  ['5-bedroom duplex in Maitama', '5-bedroom duplex. Location: Maitama. Price: ₦250,000,000.'],
  ['Inspection and payment policy', 'Inspections are Monday to Saturday, 9:00 AM to 5:00 PM. Outright payment is accepted. Installment is available on selected properties.'],
] as const;

let demoBusinessPromise: Promise<BusinessDocument> | null = null;
let knowledgeCache: { businessId: string; expiresAt: number; chunks: Array<{ content: string }> } | null = null;

async function loadDemoBusiness() {
  const business = await Business.findOneAndUpdate(
    { slug: 'tko-properties' },
    {
      $setOnInsert: {
        name: 'TKO Properties', industry: 'Real Estate', isDemo: true,
        description: 'A fictional real-estate demonstration business for TKO AI Sales Engine.',
        businessHours: 'Monday-Saturday, 9:00 AM-5:00 PM', leadNotifyThreshold: 50,
      },
    },
    { new: true, upsert: true },
  );

  const count = await KnowledgeDocument.countDocuments({ businessId: business._id, status: 'ACTIVE' });
  if (count === 0) {
    const documents = await KnowledgeDocument.insertMany(knowledge.map(([name, content]) => ({
      businessId: business._id,
      name,
      content,
      sourceType: 'PRODUCT' as const,
      status: 'ACTIVE' as const,
    })));
    await KnowledgeChunk.insertMany(documents.map((document) => ({
      businessId: business._id,
      documentId: document._id,
      content: document.content,
      metadata: { seeded: true },
    })));
  }
  return business;
}

export async function ensureDemoBusiness() {
  if (!demoBusinessPromise) {
    demoBusinessPromise = loadDemoBusiness().catch((error: unknown) => {
      demoBusinessPromise = null;
      throw error;
    });
  }
  return demoBusinessPromise;
}

export async function getDemoKnowledge(businessId: unknown) {
  const id = String(businessId);
  if (knowledgeCache?.businessId === id && knowledgeCache.expiresAt > Date.now()) {
    return knowledgeCache.chunks;
  }

  let chunks: Array<{ content: string }> = await KnowledgeChunk.find({ businessId })
    .select('content')
    .lean();
  // A previous seed may have saved documents before chunk insertion failed.
  if (!chunks.length) {
    chunks = await KnowledgeDocument.find({ businessId, status: 'ACTIVE' }).select('content').lean();
  }
  knowledgeCache = { businessId: id, expiresAt: Date.now() + 30_000, chunks };
  return chunks;
}

export async function searchDemoKnowledge(businessId: unknown, query: string) {
  const terms = query.trim().split(/\s+/).filter((term) => term.length > 2).slice(0, 6);
  if (!terms.length) return [];
  const expression = new RegExp(terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
  return (await getDemoKnowledge(businessId)).filter((chunk) => expression.test(chunk.content)).slice(0, 4);
}

export async function listDemoProperties(businessId: unknown) {
  const propertyPattern = /bedroom|duplex|terrace|apartment/i;
  return (await getDemoKnowledge(businessId)).filter((chunk) => propertyPattern.test(chunk.content));
}

export async function findDemoKnowledge(businessId: unknown, pattern: RegExp) {
  return (await getDemoKnowledge(businessId)).filter((chunk) => pattern.test(chunk.content)).slice(0, 4);
}
