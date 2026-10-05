export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'APPOINTMENT', 'WON', 'LOST'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'] as const;
export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];

export const CONVERSATION_CHANNELS = ['WEB', 'WHATSAPP', 'EMAIL'] as const;
export type ConversationChannel = (typeof CONVERSATION_CHANNELS)[number];

/**
 * ACTIVE  - the AI is answering.
 * HUMAN   - a staff member has taken over; the AI must stay silent.
 * CLOSED  - no further replies.
 */
export const CONVERSATION_STATUSES = ['ACTIVE', 'HUMAN', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const MESSAGE_ROLES = ['customer', 'assistant', 'human', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const APPOINTMENT_STATUSES = ['REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const FOLLOWUP_STATUSES = ['PENDING', 'DONE', 'CANCELLED'] as const;
export type FollowUpStatus = (typeof FOLLOWUP_STATUSES)[number];

export const KNOWLEDGE_SOURCE_TYPES = ['TEXT', 'FAQ', 'PRODUCT', 'SERVICE', 'PRICING', 'POLICY', 'HOURS', 'UPLOAD'] as const;
export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

export const KNOWLEDGE_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUSES)[number];

export const USER_ROLES = ['OWNER', 'ADMIN', 'STAFF'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AGENT_ACTION_TYPES = [
  'search_knowledge',
  'create_lead',
  'update_lead',
  'score_lead',
  'create_followup',
  'request_appointment',
  'notify_business',
  'handoff_to_human',
] as const;
export type AgentActionType = (typeof AGENT_ACTION_TYPES)[number];

export const AGENT_ACTION_STATUSES = ['SUCCESS', 'REJECTED', 'FAILED'] as const;
export type AgentActionStatus = (typeof AGENT_ACTION_STATUSES)[number];
