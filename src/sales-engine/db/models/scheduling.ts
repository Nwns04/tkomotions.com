import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';
import {
  APPOINTMENT_STATUSES,
  FOLLOWUP_STATUSES,
  type AppointmentStatus,
  type FollowUpStatus,
} from '../../domain';

export type AppointmentDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  leadId?: Types.ObjectId | null;
  conversationId?: Types.ObjectId | null;
  customer: string;
  scheduledFor: string;
  status: AppointmentStatus;
  notes: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'SalesLead', default: null, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'SalesConversation', default: null },
    customer: { type: String, default: '', trim: true, maxlength: 160 },
    // Free text in V1: customers say "Saturday morning", not an ISO timestamp.
    // The business confirms the exact slot. Avoids inventing a precise time.
    scheduledFor: { type: String, default: '', trim: true, maxlength: 160 },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'REQUESTED', index: true },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
    isDemo: { type: Boolean, default: false, index: true },
  },
  baseSchemaOptions,
);

appointmentSchema.index({ businessId: 1, createdAt: -1 });

export const Appointment: Model<AppointmentDocument> =
  (mongoose.models.SalesAppointment as Model<AppointmentDocument>) ||
  mongoose.model<AppointmentDocument>('SalesAppointment', appointmentSchema, 'sales_appointments');

export type FollowUpDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  leadId?: Types.ObjectId | null;
  conversationId?: Types.ObjectId | null;
  customer: string;
  scheduledFor: Date;
  status: FollowUpStatus;
  reason: string;
  notes: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const followUpSchema = new Schema<FollowUpDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'SalesLead', default: null, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'SalesConversation', default: null },
    customer: { type: String, default: '', trim: true, maxlength: 160 },
    scheduledFor: { type: Date, required: true, index: true },
    status: { type: String, enum: FOLLOWUP_STATUSES, default: 'PENDING', index: true },
    reason: { type: String, default: '', trim: true, maxlength: 500 },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
    isDemo: { type: Boolean, default: false, index: true },
  },
  baseSchemaOptions,
);

followUpSchema.index({ businessId: 1, scheduledFor: 1 });

export const FollowUp: Model<FollowUpDocument> =
  (mongoose.models.SalesFollowUp as Model<FollowUpDocument>) ||
  mongoose.model<FollowUpDocument>('SalesFollowUp', followUpSchema, 'sales_followups');
