import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';
import {
  KNOWLEDGE_SOURCE_TYPES,
  KNOWLEDGE_STATUSES,
  type KnowledgeSourceType,
  type KnowledgeStatus,
} from '../../domain';

export type KnowledgeDocumentRecord = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  content: string;
  sourceType: KnowledgeSourceType;
  status: KnowledgeStatus;
  createdAt: Date;
  updatedAt: Date;
};

const knowledgeDocumentSchema = new Schema<KnowledgeDocumentRecord>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 20000 },
    sourceType: { type: String, enum: KNOWLEDGE_SOURCE_TYPES, default: 'TEXT' },
    status: { type: String, enum: KNOWLEDGE_STATUSES, default: 'ACTIVE', index: true },
  },
  baseSchemaOptions,
);

knowledgeDocumentSchema.index({ businessId: 1, createdAt: -1 });

export const KnowledgeDocument: Model<KnowledgeDocumentRecord> =
  (mongoose.models.SalesKnowledgeDocument as Model<KnowledgeDocumentRecord>) ||
  mongoose.model<KnowledgeDocumentRecord>('SalesKnowledgeDocument', knowledgeDocumentSchema, 'sales_knowledge_documents');

export type KnowledgeChunkRecord = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  documentId: Types.ObjectId;
  content: string;
  // Reserved for a future embedding provider. Kept empty in V1 so the retrieval
  // contract does not change when vector search is introduced.
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const knowledgeChunkSchema = new Schema<KnowledgeChunkRecord>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'SalesKnowledgeDocument', required: true, index: true },
    content: { type: String, required: true, maxlength: 4000 },
    embedding: { type: [Number], default: [], select: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions,
);

// Text index powers V1 keyword retrieval. Scoped per query by businessId.
knowledgeChunkSchema.index({ content: 'text' });
knowledgeChunkSchema.index({ businessId: 1, documentId: 1 });

export const KnowledgeChunk: Model<KnowledgeChunkRecord> =
  (mongoose.models.SalesKnowledgeChunk as Model<KnowledgeChunkRecord>) ||
  mongoose.model<KnowledgeChunkRecord>('SalesKnowledgeChunk', knowledgeChunkSchema, 'sales_knowledge_chunks');
