import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';
import {
  CONVERSATION_CHANNELS,
  CONVERSATION_STATUSES,
  MESSAGE_ROLES,
  type ConversationChannel,
  type ConversationStatus,
  type MessageRole,
} from '../../domain';

export type ConversationDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  leadId?: Types.ObjectId | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  visitorKey: string;
  handoffReason: string;
  takenOverBy?: Types.ObjectId | null;
  takenOverAt?: Date | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const conversationSchema = new Schema<ConversationDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'SalesLead', default: null, index: true },
    // `channel` exists from day one so WhatsApp and email can enter the same
    // pipeline later without a schema migration.
    channel: { type: String, enum: CONVERSATION_CHANNELS, default: 'WEB', index: true },
    status: { type: String, enum: CONVERSATION_STATUSES, default: 'ACTIVE', index: true },
    // Opaque per-visitor identifier. Not trusted for authorisation, only for
    // stitching a browser session back to its conversation.
    visitorKey: { type: String, default: '', index: true, maxlength: 120 },
    handoffReason: { type: String, default: '', trim: true, maxlength: 500 },
    takenOverBy: { type: Schema.Types.ObjectId, ref: 'SalesUser', default: null },
    takenOverAt: { type: Date, default: null },
    lastMessageAt: { type: Date, default: () => new Date() },
  },
  baseSchemaOptions,
);

conversationSchema.index({ businessId: 1, lastMessageAt: -1 });

export const Conversation: Model<ConversationDocument> =
  (mongoose.models.SalesConversation as Model<ConversationDocument>) ||
  mongoose.model<ConversationDocument>('SalesConversation', conversationSchema, 'sales_conversations');

export type MessageDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: MessageRole;
  content: string;
  authorId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

const messageSchema = new Schema<MessageDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'SalesConversation', required: true, index: true },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true, maxlength: 8000 },
    // Set when a human staff member authored the message.
    authorId: { type: Schema.Types.ObjectId, ref: 'SalesUser', default: null },
  },
  baseSchemaOptions,
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message: Model<MessageDocument> =
  (mongoose.models.SalesMessage as Model<MessageDocument>) ||
  mongoose.model<MessageDocument>('SalesMessage', messageSchema, 'sales_messages');
