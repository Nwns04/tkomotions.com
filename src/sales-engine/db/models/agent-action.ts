import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';
import {
  AGENT_ACTION_STATUSES,
  AGENT_ACTION_TYPES,
  type AgentActionStatus,
  type AgentActionType,
} from '../../domain';

/**
 * Audit trail for every tool the model asked us to run, including the ones we
 * refused. A rejected action is as important as a successful one: it is the
 * record that validation held.
 */
export type AgentActionDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  conversationId?: Types.ObjectId | null;
  actionType: AgentActionType;
  status: AgentActionStatus;
  payload: Record<string, unknown>;
  result: string;
  createdAt: Date;
  updatedAt: Date;
};

const agentActionSchema = new Schema<AgentActionDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'SalesConversation', default: null, index: true },
    actionType: { type: String, enum: AGENT_ACTION_TYPES, required: true, index: true },
    status: { type: String, enum: AGENT_ACTION_STATUSES, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    result: { type: String, default: '', maxlength: 2000 },
  },
  baseSchemaOptions,
);

agentActionSchema.index({ businessId: 1, createdAt: -1 });

export const AgentAction: Model<AgentActionDocument> =
  (mongoose.models.SalesAgentAction as Model<AgentActionDocument>) ||
  mongoose.model<AgentActionDocument>('SalesAgentAction', agentActionSchema, 'sales_agent_actions');
